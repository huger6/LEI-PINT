const { models } = require('../config/db');
const { logger } = require('../utils/logger');

const listNotifications = async (req, res) => {
    try {
        const userId = req.user.sub;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await models.notifications.findAndCountAll({
            where: { user_id: userId },
            include: [{ model: models.notification_definitions, as: 'definition' }],
            order: [['sent_at', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        logger.error('Error listing notifications', { error });
        return res.status(500).json({ success: false, code: 'NOTIFICATIONS_LIST_FAILED' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.sub;
        const notificationId = Number.parseInt(req.params.notificationId, 10);
        if (Number.isNaN(notificationId)) {
            return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_ID' });
        }

        const notification = await models.notifications.findOne({
            where: { notification_id: notificationId, user_id: userId }
        });

        if (!notification) {
            return res.status(404).json({ success: false, code: 'NOTIFICATION_NOT_FOUND' });
        }

        if (notification.is_read) {
            return res.status(200).json({ success: true, code: 'NOTIFICATION_ALREADY_READ' });
        }

        await notification.update({ is_read: true });

        return res.status(200).json({ success: true, code: 'NOTIFICATION_MARKED_READ' });

    } catch (error) {
        logger.error('Error marking notification read', { error });
        return res.status(500).json({ success: false, code: 'NOTIFICATION_MARK_READ_FAILED' });
    }
};

module.exports = {
    listNotifications,
    markAsRead
};
