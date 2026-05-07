const express = require('express');
const router = express.Router();

const { loginRequired } = require('../middlewares/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

router.get('/', loginRequired, notificationsController.listNotifications);
router.get('/unread-count', loginRequired, notificationsController.getUnreadCount);
router.put('/read-all', loginRequired, notificationsController.markAllAsRead);
router.put('/:notificationId/read', loginRequired, notificationsController.markAsRead);

module.exports = router;
