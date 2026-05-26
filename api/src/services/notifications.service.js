const { models } = require('../config/db');
const { emitToUser } = require('../config/websocket');
const { broadcastToWebhooks } = require('./integrations.service');

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

    return notification;
};

module.exports = {
    createNotification,
    VALID_NOTIFICATION_TYPES
};
