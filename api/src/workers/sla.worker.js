const cron = require('node-cron');
const { QueryTypes } = require('sequelize');
const { models } = require('../models');
const emailService = require('../services/email.service');
const { createNotification, resolvePreferences } = require('../services/notifications.service');
const { logger } = require('../utils/logger');

const SLA_CRON_SCHEDULE = '*/15 * * * *';
const SLA_BREACH_DEFINITION_ID = 14;
const DEFAULT_LANGUAGE = 'en-GB';
const sequelize = models.badge_applications.sequelize;

let isRunning = false;

const breachedApplicationsQuery = `
    SELECT DISTINCT ON (ba.application_id, s.sla_id)
        ba.application_id,
        ba.application_guid,
        ba.application_state,
        ba.submitted_at,
        ba.user_id AS applicant_user_id,
        applicant.full_name AS applicant_name,
        b.badge_id,
        b.badge_title,
        b.service_line_id,
        s.sla_id,
        s.sla_name,
        s.response_time_hours,
        s.target_profile,
        COALESCE(s.is_global, FALSE) AS is_global,
        EXTRACT(
            EPOCH FROM (
                NOW() - (ba.submitted_at + (s.response_time_hours * INTERVAL '1 hour'))
            )
        ) / 3600 AS hours_exceeded
    FROM badge_applications ba
    INNER JOIN badges b
        ON b.badge_id = ba.badge_id
    INNER JOIN consultants c
        ON c.user_id = ba.user_id
    INNER JOIN users applicant
        ON applicant.user_id = c.user_id
    INNER JOIN slas s
        ON s.is_active = TRUE
        AND NOW() BETWEEN s.start_date AND s.end_date
        AND s.target_profile = CASE
            WHEN ba.application_state = 'Submitted' THEN 'Talent Manager'
            WHEN ba.application_state = 'In validation' THEN 'Service Line Leader'
        END
    LEFT JOIN sl_slas sls
        ON sls.sla_id = s.sla_id
        AND sls.service_line_id = b.service_line_id
    WHERE ba.closed_at IS NULL
        AND ba.submitted_at IS NOT NULL
        AND ba.application_state IN ('Submitted', 'In validation')
        AND (COALESCE(s.is_global, FALSE) = TRUE OR sls.sla_id IS NOT NULL)
        AND NOW() > ba.submitted_at + (s.response_time_hours * INTERVAL '1 hour')
    ORDER BY ba.application_id, s.sla_id, s.response_time_hours ASC;
`;

const recipientsQuery = `
    SELECT DISTINCT
        u.user_id,
        u.email_address,
        COALESCE(l.language_iso, :defaultLanguage) AS language_iso
    FROM users u
    LEFT JOIN languages l
        ON l.language_id = u.language_id
    LEFT JOIN talent_managers tm
        ON tm.user_id = u.user_id
    LEFT JOIN service_line_leaders sll
        ON sll.user_id = u.user_id
    WHERE u.is_active = TRUE
        AND u.email_address IS NOT NULL
        AND u.user_role = :targetProfile
        AND (
            (
                :targetProfile = 'Talent Manager'
                AND tm.user_id IS NOT NULL
            )
            OR (
                :targetProfile = 'Service Line Leader'
                AND sll.user_id IS NOT NULL
                AND (:isGlobal = TRUE OR sll.service_line_id = :serviceLineId)
            )
        );
`;

const getBreachedApplications = () =>
    sequelize.query(breachedApplicationsQuery, {
        type: QueryTypes.SELECT
    });

const getTargetRecipients = ({ target_profile, is_global, service_line_id }) =>
    sequelize.query(recipientsQuery, {
        type: QueryTypes.SELECT,
        replacements: {
            targetProfile: target_profile,
            isGlobal: is_global,
            serviceLineId: service_line_id,
            defaultLanguage: DEFAULT_LANGUAGE
        }
    });

const buildEmailData = (breach, recipientLanguage) => ({
    applicationId: breach.application_id,
    applicationGuid: breach.application_guid,
    applicationState: breach.application_state,
    applicantName: breach.applicant_name,
    badgeTitle: breach.badge_title,
    slaName: breach.sla_name,
    responseTimeHours: breach.response_time_hours,
    hoursExceeded: Number(Number(breach.hours_exceeded || 0).toFixed(2)),
    targetProfile: breach.target_profile,
    targetLanguage: recipientLanguage || DEFAULT_LANGUAGE,
    language: recipientLanguage || DEFAULT_LANGUAGE
});

const wasAlreadyAlerted = async (slaId, applicationId, userId) => {
    const existing = await models.sla_breach_alerts.findOne({
        where: { sla_id: slaId, application_id: applicationId, user_id: userId }
    });
    return !!existing;
};

const markAlerted = async (slaId, applicationId, userId) => {
    // Idempotent: concurrent worker runs can race past wasAlreadyAlerted, so use
    // findOrCreate to avoid the unique-constraint violation (and its log noise).
    await models.sla_breach_alerts.findOrCreate({
        where: { sla_id: slaId, application_id: applicationId, user_id: userId },
        defaults: { sla_id: slaId, application_id: applicationId, user_id: userId }
    });
};

const processSlaBreaches = async () => {
    if (isRunning) {
        logger.warn('SLA breach worker skipped because the previous run is still active');
        return;
    }

    isRunning = true;

    try {
        const breaches = await getBreachedApplications();

        for (const breach of breaches) {
            const recipients = await getTargetRecipients(breach);

            for (const recipient of recipients) {
                try {
                    if (await wasAlreadyAlerted(breach.sla_id, breach.application_id, recipient.user_id)) {
                        continue;
                    }

                    await createNotification({
                        userId: recipient.user_id,
                        definitionId: SLA_BREACH_DEFINITION_ID,
                        notificationType: 'SYSTEM',
                        title: 'NOTIF_SLA_BREACH_TITLE',
                        body: 'NOTIF_SLA_BREACH_BODY',
                        meta: {
                            slaName: breach.sla_name,
                            badgeTitle: breach.badge_title,
                            applicantName: breach.applicant_name,
                            hoursExceeded: Number(Number(breach.hours_exceeded || 0).toFixed(2))
                        },
                        url: `/admin/applications/${breach.application_guid}`
                    });

                    const prefs = await resolvePreferences(SLA_BREACH_DEFINITION_ID, recipient.user_id);
                    if (prefs.is_enabled && prefs.send_email) {
                        const emailData = buildEmailData(breach, recipient.language_iso);
                        await emailService.sendSlaBreachAlert(recipient.email_address, emailData);
                    }

                    await markAlerted(breach.sla_id, breach.application_id, recipient.user_id);
                } catch (error) {
                    logger.error('Failed to send SLA breach alert', {
                        error,
                        applicationId: breach.application_id,
                        slaId: breach.sla_id,
                        recipientId: recipient.user_id
                    });
                }
            }
        }

        logger.info('SLA breach worker completed', { breachCount: breaches.length });
    } catch (error) {
        logger.error('SLA breach worker failed', { error });
    } finally {
        isRunning = false;
    }
};

const task = cron.schedule(SLA_CRON_SCHEDULE, processSlaBreaches);

module.exports = {
    task,
    processSlaBreaches,
    getBreachedApplications,
    getTargetRecipients
};
