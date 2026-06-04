const { logger } = require('../utils/logger');

let admin;
try {
    if (!process.env.SKIP_FIREBASE) {
        admin = require('../config/firebase');
    }
} catch (err) {
    // If firebase isn't installed or fails to initialize, continue with a noop admin
    admin = null;
    logger && logger.info && logger.info('Firebase admin not available; firebase.service will be no-op');
}

const sendPushToUser = async (tokens, { title, body, data = {} }) => {
    if (!admin || !tokens.length) return [];

    const results = [];
    const staleTokenIds = [];

    for (const dt of tokens) {
        const message = {
            token: dt.fcm_token,
            notification: { title, body },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
            )
        };

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
