const admin = require('../config/firebase');
const logger = require('../utils/logger');

const sendTopicUpdate = async (topic = "new_data", updateCode) => {
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
        logger.error("Error sending topic update to Firebase", error);
        // supress the error as there's nothing to be done
    }
}

module.exports = {
    sendTopicUpdate
};
