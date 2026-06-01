const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { emitToUser } = require('../config/websocket');
const { handleZodError } = require('../utils/responseHelper');
const { listNotificationsQuery, notificationIdParam } = require('../validations/notifications.validation');

const listNotifications = async (req, res) => {
    try {
        const userId = req.user.sub;

        let validated;
        try {
            validated = listNotificationsQuery.parse(req.query);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');
            throw error;
        }

        const { page, limit, type, is_read } = validated;
        const offset = (page - 1) * limit;

        const where = { user_id: userId };

        if (type) {
            where.notification_type = type;
        }

        if (is_read !== undefined) {
            where.is_read = is_read;
        }

        const { count, rows } = await models.notifications.findAndCountAll({
            where,
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

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.sub;

        const count = await models.notifications.count({
            where: { user_id: userId, is_read: false }
        });

        return res.status(200).json({ success: true, data: { unread_count: count } });

    } catch (error) {
        logger.error('Error getting unread count', { error });
        return res.status(500).json({ success: false, code: 'NOTIFICATIONS_UNREAD_COUNT_FAILED' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.sub;

        let validated;
        try {
            validated = notificationIdParam.parse(req.params);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_ID');
            throw error;
        }

        const { notificationId } = validated;

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

        // Notify all connected clients of this user so every tab stays in sync.
        emitToUser(userId, 'notification:read', { notification_id: notificationId });

        return res.status(200).json({ success: true, code: 'NOTIFICATION_MARKED_READ' });

    } catch (error) {
        logger.error('Error marking notification read', { error });
        return res.status(500).json({ success: false, code: 'NOTIFICATION_MARK_READ_FAILED' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.sub;

        const [updatedCount] = await models.notifications.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );

        if (updatedCount > 0) {
            emitToUser(userId, 'notification:all-read', {});
        }

        return res.status(200).json({ success: true, code: 'NOTIFICATIONS_ALL_MARKED_READ', data: { updated: updatedCount } });

    } catch (error) {
        logger.error('Error marking all notifications read', { error });
        return res.status(500).json({ success: false, code: 'NOTIFICATIONS_MARK_ALL_READ_FAILED' });
    }
};

module.exports = {
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
