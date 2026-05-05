const { models } = require('../config/db');

/**
 * Create a notification record for a user.
 * Stores payload in `notification_payload` (JSON string).
 */
const createNotification = async ({ userId, definitionId = null, title = null, body = null, meta = null, url = null }) => {
    const payload = { title: title || null, body: body || null, meta: meta || null };

    return models.notifications.create({
        user_id: userId,
        definition_id: definitionId,
        notification_payload: JSON.stringify(payload),
        notification_url: url || null,
        is_read: false
    });
};

module.exports = {
    createNotification
};
