const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { emitToUser } = require('../config/websocket');
const { VALID_NOTIFICATION_TYPES } = require('../services/notifications.service');

const listNotifications = async (req, res) => {
    try {
        const userId = req.user.sub;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const where = { user_id: userId };

        if (req.query.type) {
            if (!VALID_NOTIFICATION_TYPES.includes(req.query.type)) {
                return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_NOTIFICATION_TYPE' });
            }
            where.notification_type = req.query.type;
        }

        if (req.query.is_read !== undefined) {
            where.is_read = req.query.is_read === 'true';
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
