const cron = require('node-cron');
const { QueryTypes } = require('sequelize');
const { models } = require('../models');
const emailService = require('../services/email.service');
const { logger } = require('../utils/logger');

const CUSTOM_SLA_CRON_SCHEDULE = '*/15 * * * *';
const DEFAULT_LANGUAGE = 'en-GB';
const sequelize = models.slas.sequelize;

let isRunning = false;

const breachedStandaloneSlasQuery = `
    SELECT
        s.sla_id,
        s.sla_name,
        s.target_profile,
        s.sla_description,
        s.end_date,
        s.user_id,
        COUNT(DISTINCT sls.service_line_id)::int AS service_line_scope_count
    FROM slas s
    LEFT JOIN sl_slas sls
        ON sls.sla_id = s.sla_id
    WHERE s.is_active = TRUE
        AND NOW() > s.end_date
        AND to_jsonb(s)->>'trigger_state' IS NULL
    GROUP BY
        s.sla_id,
        s.sla_name,
        s.target_profile,
        s.sla_description,
        s.end_date,
        s.user_id
    ORDER BY s.end_date ASC;
`;

const targetUsersQuery = `
    WITH linked_service_lines AS (
        SELECT sls.service_line_id
        FROM sl_slas sls
        WHERE sls.sla_id = :slaId
    ),
    scope AS (
        SELECT COUNT(*)::int AS service_line_count
        FROM linked_service_lines
    )
    SELECT DISTINCT
        u.user_id,
        u.full_name,
        u.email_address,
        COALESCE(l.language_iso, :defaultLanguage) AS language_iso
    FROM users u
    LEFT JOIN languages l
        ON l.language_id = u.language_id
    LEFT JOIN consultants c
        ON c.user_id = u.user_id
    LEFT JOIN consultant_areas ca
        ON ca.user_id = c.user_id
    LEFT JOIN areas a
        ON a.area_id = ca.area_id
    LEFT JOIN service_line_leaders sll
        ON sll.user_id = u.user_id
    LEFT JOIN talent_managers tm
        ON tm.user_id = u.user_id
    LEFT JOIN administrators adm
        ON adm.user_id = u.user_id
    CROSS JOIN scope
    WHERE u.is_active = TRUE
        AND u.email_address IS NOT NULL
        AND (
            (
                :targetUserId IS NOT NULL
                AND u.user_id = :targetUserId
            )
            OR (
                :targetUserId IS NULL
                AND u.user_role = :targetProfile
                AND (
                    scope.service_line_count = 0
                    OR (
                        :targetProfile = 'Consultant'
                        AND a.service_line_id IN (SELECT service_line_id FROM linked_service_lines)
                    )
                    OR (
                        :targetProfile = 'Service Line Leader'
                        AND sll.service_line_id IN (SELECT service_line_id FROM linked_service_lines)
                    )
                    OR (
                        :targetProfile = 'Talent Manager'
                        AND tm.user_id IS NOT NULL
                    )
                    OR (
                        :targetProfile = 'Administrator'
                        AND adm.user_id IS NOT NULL
                    )
                )
            )
        );
`;

const getBreachedStandaloneSlas = () =>
    sequelize.query(breachedStandaloneSlasQuery, {
        type: QueryTypes.SELECT
    });

const getTargetUsersForSla = (sla) =>
    sequelize.query(targetUsersQuery, {
        type: QueryTypes.SELECT,
        replacements: {
            slaId: sla.sla_id,
            targetUserId: sla.user_id,
            targetProfile: sla.target_profile,
            defaultLanguage: DEFAULT_LANGUAGE
        }
    });

const buildEmailData = (sla, recipient) => ({
    slaName: sla.sla_name,
    targetProfile: sla.target_profile,
    slaDescription: sla.sla_description,
    deadline: sla.end_date,
    recipientName: recipient.full_name,
    targetLanguage: recipient.language_iso || DEFAULT_LANGUAGE,
    language: recipient.language_iso || DEFAULT_LANGUAGE
});

const sendAlert = async (recipient, sla) => {
    const emailData = buildEmailData(sla, recipient);
    return emailService.sendCustomSlaBreachAlert(recipient.email_address, emailData);
};

const processCustomSlaBreaches = async () => {
    if (isRunning) {
        logger.warn('Custom SLA worker skipped because the previous run is still active');
        return;
    }

    isRunning = true;

    try {
        const breachedSlas = await getBreachedStandaloneSlas();

        for (const sla of breachedSlas) {
            const recipients = await getTargetUsersForSla(sla);

            for (const recipient of recipients) {
                try {
                    await sendAlert(recipient, sla);
                } catch (error) {
                    logger.error('Failed to send custom SLA breach alert', {
                        error,
                        slaId: sla.sla_id,
                        recipientId: recipient.user_id
                    });
                }
            }
        }

        logger.info('Custom SLA worker completed', { breachCount: breachedSlas.length });
    } catch (error) {
        logger.error('Custom SLA worker failed', { error });
    } finally {
        isRunning = false;
    }
};

const task = cron.schedule(CUSTOM_SLA_CRON_SCHEDULE, processCustomSlaBreaches);

module.exports = {
    task,
    processCustomSlaBreaches,
    getBreachedStandaloneSlas,
    getTargetUsersForSla
};
