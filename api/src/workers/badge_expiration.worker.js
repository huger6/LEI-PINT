const cron = require('node-cron');
const { QueryTypes } = require('sequelize');
const { models } = require('../models');
const { createNotification } = require('../services/notifications.service');
const { logger } = require('../utils/logger');

const BADGE_EXPIRATION_SCHEDULE = '0 * * * *';
const sequelize = models.awarded_badges.sequelize;

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
        EXTRACT(DAY FROM ab.expiration_at - NOW())::int AS days_remaining
    FROM awarded_badges ab
    INNER JOIN badge_applications ba ON ba.application_id = ab.application_id
    INNER JOIN badges b ON b.badge_id = ba.badge_id
    INNER JOIN users u ON u.user_id = ab.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
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
        b.badge_slug
    FROM awarded_badges ab
    INNER JOIN badge_applications ba ON ba.application_id = ab.application_id
    INNER JOIN badges b ON b.badge_id = ba.badge_id
    INNER JOIN users u ON u.user_id = ab.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
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
