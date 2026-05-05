const express = require('express');
const router = express.Router();

const { loginRequired } = require('../middlewares/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

/**
 * @route GET /api/notifications
 * @desc  List authenticated user's notifications (paginated)
 */
router.get('/', loginRequired, notificationsController.listNotifications);

/**
 * @route PUT /api/notifications/:notificationId/read
 * @desc  Mark a user's notification as read
 */
router.put('/:notificationId/read', loginRequired, notificationsController.markAsRead);

module.exports = router;
