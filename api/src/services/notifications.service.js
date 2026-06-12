const { models } = require('../config/db');
const { emitToUser } = require('../config/websocket');
const { broadcastToWebhooks } = require('./integrations.service');
const { sendPushToUser } = require('./firebase.service');
const { logger } = require('../utils/logger');

const VALID_NOTIFICATION_TYPES = ['HOME', 'BADGES', 'APPLICATIONS', 'ACHIEVEMENTS', 'POINTS', 'OBJECTIVES', 'EVOLUTION', 'ANNOUNCEMENTS', 'SYSTEM'];

const createNotification = async ({ userId, definitionId, notificationType, title = null, body = null, meta = null, url = null }) => {
    if (!VALID_NOTIFICATION_TYPES.includes(notificationType)) {
        throw new Error(`Invalid notification_type: ${notificationType}`);
    }

    const payload = { title: title || null, body: body || null, meta: meta || null };

    const notification = await models.notifications.create({
        user_id: userId,
        definition_id: definitionId,
        notification_payload: JSON.stringify(payload),
        notification_url: url || null,
        notification_type: notificationType,
        is_read: false
    });

    // Push the new notification to the user in real time so connected clients
    // can update their UI without polling.
    emitToUser(userId, 'notification:new', {
        notification_id: notification.notification_id,
        definition_id: notification.definition_id,
        notification_payload: payload,
        notification_url: notification.notification_url,
        notification_type: notification.notification_type,
        is_read: false,
        sent_at: notification.sent_at
    });

    // Fire-and-forget: broadcast to configured external webhooks (Teams/Slack)
    if (notificationType === 'BADGES' || notificationType === 'ACHIEVEMENTS') {
        broadcastToWebhooks(models, {
            title: title || 'New Badge Notification',
            body: body || '',
            badgeImageUrl: meta?.badge_img_url || null,
            verificationUrl: url || null
        });
    }

    if (definitionId) {
        (async () => {
            try {
                const prefs = await resolvePreferences(definitionId, userId);
                if (!prefs.is_enabled || !prefs.send_push) return;

                const deviceTokens = await models.device_tokens.findAll({
                    where: { user_id: userId, is_active: true },
                    attributes: ['device_token_id', 'fcm_token']
                });
                if (!deviceTokens.length) return;

                const { staleTokenIds } = await sendPushToUser(deviceTokens, {
                    title: title || 'New notification',
                    body: body || '',
                    data: {
                        notification_id: String(notification.notification_id),
                        notification_type: notificationType,
                        notification_url: url || ''
                    }
                });

                if (staleTokenIds.length) {
                    await models.device_tokens.update(
                        { is_active: false },
                        { where: { device_token_id: staleTokenIds } }
                    );
                }
            } catch (err) {
                logger.error('FCM push dispatch failed', { err, userId, definitionId });
            }
        })();
    }

    return notification;
};

const resolvePreferences = async (definitionId, userId) => {
    const globalPref = await models.notification_preferences.findOne({
        where: { definition_id: definitionId }
    });

    const effective = {
        is_enabled: globalPref ? globalPref.is_enabled : true,
        send_push: globalPref ? globalPref.send_push : true,
        send_email: globalPref ? globalPref.send_email : true
    };

    const userPref = await models.user_notification_preferences.findOne({
        where: { user_id: userId, definition_id: definitionId }
    });

    if (userPref) {
        if (userPref.is_enabled !== null) effective.is_enabled = userPref.is_enabled;
        if (userPref.send_push !== null) effective.send_push = userPref.send_push;
        if (userPref.send_email !== null) effective.send_email = userPref.send_email;
    }

    return effective;
};

module.exports = {
    createNotification,
    resolvePreferences,
    VALID_NOTIFICATION_TYPES
};
