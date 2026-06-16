const cron = require('node-cron');
const { QueryTypes } = require('sequelize');
const { models } = require('../models');
const { createNotification, resolvePreferences } = require('../services/notifications.service');
const emailService = require('../services/email.service');
const { logger } = require('../utils/logger');

const BADGE_EXPIRATION_SCHEDULE = '0 * * * *';
const sequelize = models.awarded_badges.sequelize;
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');
const BADGE_EXPIRING_DEFINITION_ID = 12;
const BADGE_EXPIRED_DEFINITION_ID = 13;

const ALERT_THRESHOLDS = [30, 7, 1];

let isRunning = false;

const expiringBadgesQuery = `
    SELECT
        ab.awarded_badges_id,
        ab.user_id,
        ab.expiration_at,
        ab.last_expiry_alert_days,
        b.badge_title,
        b.badge_type,
        b.badge_slug,
        u.email_address,
        u.full_name,
        ln.language_iso,
        EXTRACT(DAY FROM ab.expiration_at - NOW())::int AS days_remaining
    FROM awarded_badges ab
    INNER JOIN badge_applications ba ON ba.application_id = ab.application_id
    INNER JOIN badges b ON b.badge_id = ba.badge_id
    INNER JOIN users u ON u.user_id = ab.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
    LEFT JOIN languages ln ON ln.language_id = u.language_id
    WHERE ab.expiration_at IS NOT NULL
      AND ab.expiration_at > NOW()
      AND EXTRACT(DAY FROM ab.expiration_at - NOW()) <= 30
`;

const expiredBadgesQuery = `
    SELECT
        ab.awarded_badges_id,
        ab.user_id,
        ab.expiration_at,
        ab.last_expiry_alert_days,
        b.badge_title,
        b.badge_type,
        b.badge_slug,
        u.email_address,
        u.full_name,
        ln.language_iso
    FROM awarded_badges ab
    INNER JOIN badge_applications ba ON ba.application_id = ab.application_id
    INNER JOIN badges b ON b.badge_id = ba.badge_id
    INNER JOIN users u ON u.user_id = ab.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
    LEFT JOIN languages ln ON ln.language_id = u.language_id
    WHERE ab.expiration_at IS NOT NULL
      AND ab.expiration_at <= NOW()
      AND (ab.last_expiry_alert_days IS NULL OR ab.last_expiry_alert_days > 0)
`;

const getApplicableThreshold = (daysRemaining, lastAlertDays) => {
    for (const threshold of ALERT_THRESHOLDS) {
        if (daysRemaining <= threshold) {
            if (lastAlertDays === null || lastAlertDays > threshold) {
                return threshold;
            }
        }
    }
    return null;
};

const processBadgeExpirations = async () => {
    if (isRunning) {
        logger.warn('Badge expiration worker skipped because the previous run is still active');
        return;
    }

    isRunning = true;

    try {
        const expiringBadges = await sequelize.query(expiringBadgesQuery, { type: QueryTypes.SELECT });

        for (const badge of expiringBadges) {
            const threshold = getApplicableThreshold(badge.days_remaining, badge.last_expiry_alert_days);
            if (!threshold) continue;

            try {
                await createNotification({
                    userId: badge.user_id,
                    definitionId: 12,
                    notificationType: 'BADGES',
                    title: 'NOTIF_BADGE_EXPIRING_SOON_TITLE',
                    body: 'NOTIF_BADGE_EXPIRING_SOON_BODY',
                    meta: {
                        badgeTitle: badge.badge_title,
                        badgeType: badge.badge_type,
                        daysRemaining: badge.days_remaining
                    },
                    url: `/badges/${badge.badge_slug}`
                });

                const prefs = await resolvePreferences(BADGE_EXPIRING_DEFINITION_ID, badge.user_id);
                if (prefs.is_enabled && prefs.send_email && badge.email_address) {
                    await emailService.sendBadgeExpiringEmail(badge.email_address, {
                        name: badge.full_name,
                        badgeTitle: badge.badge_title,
                        days: badge.days_remaining,
                        badgeUrl: `${APP_URL}/badges/${badge.badge_slug}`,
                        lang: badge.language_iso
                    });
                }

                await models.awarded_badges.update(
                    { last_expiry_alert_days: threshold },
                    { where: { awarded_badges_id: badge.awarded_badges_id } }
                );
            } catch (err) {
                logger.error('Failed to send badge expiration alert', {
                    error: err,
                    awardedBadgeId: badge.awarded_badges_id
                });
            }
        }

        const expiredBadges = await sequelize.query(expiredBadgesQuery, { type: QueryTypes.SELECT });

        for (const badge of expiredBadges) {
            try {
                await createNotification({
                    userId: badge.user_id,
                    definitionId: 13,
                    notificationType: 'BADGES',
                    title: 'NOTIF_BADGE_EXPIRED_TITLE',
                    body: 'NOTIF_BADGE_EXPIRED_BODY',
                    meta: {
                        badgeTitle: badge.badge_title,
                        badgeType: badge.badge_type
                    },
                    url: `/badges/${badge.badge_slug}`
                });

                const prefs = await resolvePreferences(BADGE_EXPIRED_DEFINITION_ID, badge.user_id);
                if (prefs.is_enabled && prefs.send_email && badge.email_address) {
                    await emailService.sendBadgeExpiredEmail(badge.email_address, {
                        name: badge.full_name,
                        badgeTitle: badge.badge_title,
                        badgeUrl: `${APP_URL}/badges/${badge.badge_slug}`,
                        lang: badge.language_iso
                    });
                }

                await models.awarded_badges.update(
                    { last_expiry_alert_days: 0 },
                    { where: { awarded_badges_id: badge.awarded_badges_id } }
                );
            } catch (err) {
                logger.error('Failed to send badge expired notification', {
                    error: err,
                    awardedBadgeId: badge.awarded_badges_id
                });
            }
        }

        const totalAlerts = expiringBadges.length + expiredBadges.length;
        if (totalAlerts > 0) {
            logger.info('Badge expiration worker completed', {
                expiringAlerts: expiringBadges.length,
                expiredAlerts: expiredBadges.length
            });
        }
    } catch (error) {
        logger.error('Badge expiration worker failed', { error });
    } finally {
        isRunning = false;
    }
};

const task = cron.schedule(BADGE_EXPIRATION_SCHEDULE, processBadgeExpirations);

module.exports = {
    task,
    processBadgeExpirations
};
