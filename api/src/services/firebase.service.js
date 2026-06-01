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
    sendTopicUpdate
};
