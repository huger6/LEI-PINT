const { logger } = require('../utils/logger');

let admin;
// SKIP_FIREBASE is a string env var. Only explicit on-values disable Firebase;
// note that '0' is a non-empty (truthy) string, so a bare `!process.env.SKIP_FIREBASE`
// would wrongly skip when SKIP_FIREBASE=0. This mirrors the check in app.js.
const skipFirebase = ['1', 'true'].includes(String(process.env.SKIP_FIREBASE || '').toLowerCase());
try {
    if (!skipFirebase) {
        admin = require('../config/firebase');
    }
} catch (err) {
    // If firebase isn't installed or fails to initialize, continue with a noop admin
    admin = null;
    logger && logger.info && logger.info('Firebase admin not available; firebase.service will be no-op');
}

// Sends a SILENT, data-only push. The API is just a messenger: it ships the
// translation KEYS (e.g. NOTIF_APP_BADGE_AWARDED_TITLE) plus any interpolation
// meta in the data payload, and the mobile app translates and renders the
// notification itself. We deliberately never set the OS-visible `notification`
// block — doing so previously caused the raw i18n key to appear on screen.
const sendPushToUser = async (tokens, { title, body, data = {}, notification = null }) => {
    // Always return the same shape so callers can safely destructure
    // `staleTokenIds` even when Firebase is disabled or there are no tokens.
    if (!admin || !tokens.length) return { results: [], staleTokenIds: [] };

    const results = [];
    const staleTokenIds = [];

    // Fold the event/translation keys into the data payload (FCM data values
    // must be strings).
    const payload = {
        ...data,
        ...(title ? { title_key: title } : {}),
        ...(body ? { body_key: body } : {})
    };
    const stringData = Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, String(v ?? '')])
    );

    for (const dt of tokens) {
        const message = {
            token: dt.fcm_token,
            // Data-only message (no `notification` block) so the OS does not
            // render anything by itself.
            data: stringData,
            // Wake the app to process/render the silent message reliably.
            android: { priority: 'high' },
            apns: {
                headers: { 'apns-priority': '5', 'apns-push-type': 'background' },
                payload: { aps: { 'content-available': 1 } }
            }
        };

        // When a pre-translated OS `notification` block is supplied, attach it so
        // the operating system renders the push itself. Unlike the silent data-only
        // path, this is reliably shown in every app state (foreground, background
        // and terminated, including iOS). Used for the hardcoded PT demo push.
        if (notification && (notification.title || notification.body)) {
            message.notification = {
                title: notification.title || '',
                body: notification.body || ''
            };
            message.android = {
                priority: 'high',
                notification: { channelId: 'softinsa_default', sound: 'default' }
            };
            message.apns = {
                headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
                payload: {
                    aps: {
                        alert: { title: notification.title || '', body: notification.body || '' },
                        sound: 'default'
                    }
                }
            };
        }

        try {
            const response = await admin.messaging().send(message);
            results.push({ device_token_id: dt.device_token_id, success: true, response });
        } catch (error) {
            if (
                error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token'
            ) {
                staleTokenIds.push(dt.device_token_id);
                logger.info('Stale FCM token detected', { device_token_id: dt.device_token_id });
            } else {
                logger.error('Error sending FCM push', { error, device_token_id: dt.device_token_id });
            }
            results.push({ device_token_id: dt.device_token_id, success: false, error: error.code });
        }
    }

    return { results, staleTokenIds };
};

const sendTopicUpdate = async (topic = 'new_data', updateCode) => {
    if (!admin) {
        // noop in environments where firebase is skipped
        return null;
    }

    const message = {
        topic: topic,
        data: {
            update_code: String(updateCode),
            timestamp: new Date().toISOString()
        }
    };

    try {
        const response = await admin.messaging().send(message);
        return response;
    } catch (error) {
        logger.error('Error sending topic update to Firebase', error);
        // suppress the error as there's nothing to be done
    }
};

module.exports = {
    sendTopicUpdate,
    sendPushToUser
};
