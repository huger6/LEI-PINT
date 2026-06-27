const express = require('express');
const router = express.Router();

const { loginRequired } = require('../middlewares/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');
const deviceTokensController = require('../controllers/deviceTokens.controller');
const notifPrefsController = require('../controllers/notificationPreferences.controller');

router.get('/', loginRequired, notificationsController.listNotifications);
router.get('/unread-count', loginRequired, notificationsController.getUnreadCount);
router.put('/read-all', loginRequired, notificationsController.markAllAsRead);
router.put('/:notificationId/read', loginRequired, notificationsController.markAsRead);

router.post('/device-tokens', loginRequired, deviceTokensController.registerToken);
router.post('/device-tokens/unregister', loginRequired, deviceTokensController.unregisterToken);
router.get('/device-tokens', loginRequired, deviceTokensController.listTokens);

router.get('/preferences', loginRequired, notifPrefsController.listUserPreferences);
router.put('/preferences/:definitionId', loginRequired, notifPrefsController.updateUserPreference);

module.exports = router;
