const { models } = require('../config/db');
const { emitToUser } = require('../config/websocket');
const { broadcastToWebhooks } = require('./integrations.service');
const { sendPushToUser } = require('./firebase.service');
const { translateNotification } = require('../utils/notificationStrings');
const { logger } = require('../utils/logger');

const VALID_NOTIFICATION_TYPES = ['HOME', 'BADGES', 'APPLICATIONS', 'ACHIEVEMENTS', 'POINTS', 'OBJECTIVES', 'EVOLUTION', 'ANNOUNCEMENTS', 'SYSTEM'];

const createNotification = async ({ userId, definitionId, notificationType, title = null, body = null, meta = null, url = null, push = null }) => {
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

                // Pre-translate the push text into the recipient's language server-side
                // and send it as an OS notification block, so the OS renders the push
                // reliably in every app state (foreground, background, terminated).
                // An explicit `push` override (if provided) takes precedence.
                let pushBlock = push;
                if (!pushBlock && (title || body)) {
                    let languageIso = null;
                    try {
                        const recipient = await models.users.findByPk(userId, {
                            attributes: ['user_id'],
                            include: [{ model: models.languages, as: 'language', attributes: ['language_iso'] }]
                        });
                        languageIso = recipient?.language?.language_iso || null;
                    } catch (_) { /* fall back to PT if language lookup fails */ }

                    const translated = translateNotification({ titleKey: title, bodyKey: body, meta, languageIso });
                    if (translated.title || translated.body) pushBlock = translated;
                }

                // The data payload still carries the translation keys (title_key/body_key)
                // + meta for the in-app notification centre and tap/sync handling.
                const { staleTokenIds } = await sendPushToUser(deviceTokens, {
                    title,
                    body,
                    data: {
                        notification_id: String(notification.notification_id),
                        notification_type: notificationType,
                        notification_url: url || '',
                        meta: meta ? JSON.stringify(meta) : ''
                    },
                    notification: pushBlock
                });

                if (staleTokenIds.length) {
                    await models.device_tokens.update(
                        { is_active: false },
                        { where: { device_token_id: staleTokenIds } }
                    );
                }
            } catch (err) {
                // Log the message/stack explicitly: a bare Error serializes to `{}`
                // under JSON logging because its fields are non-enumerable.
                logger.error('FCM push dispatch failed', {
                    error: err?.message,
                    stack: err?.stack,
                    userId,
                    definitionId
                });
            }
        })();
    }

    return notification;
};

const resolvePreferences = async (definitionId, userId) => {
    // Deterministic when the data has duplicate global rows for a definition:
    // the canonical (lowest preference_id) row is the platform default.
    const globalPref = await models.notification_preferences.findOne({
        where: { definition_id: definitionId },
        order: [['preference_id', 'ASC']]
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
