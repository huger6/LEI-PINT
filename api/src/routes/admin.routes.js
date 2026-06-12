const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const notifPrefsController = require('../controllers/notificationPreferences.controller');
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/admin/users
 * @desc    List all users
 * @access  Administrator
 */
router.get('/users', loginRequired, isAdmin, adminController.getUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user account
 * @access  Administrator
 */
router.post('/users', loginRequired, isAdmin, adminController.createUser);

/**
 * @route   GET /api/admin/users/:userGuid
 * @desc    Get a single user's full profile
 * @access  Administrator
 */
router.get('/users/:userGuid', loginRequired, isAdmin, adminController.getUser);

/**
 * @route   PUT /api/admin/users/:userGuid
 * @desc    Update a user's profile or role
 * @access  Administrator
 */
router.put('/users/:userGuid', loginRequired, isAdmin, adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:userGuid
 * @desc    Deactivate a user account (soft delete)
 * @access  Administrator
 */
router.delete('/users/:userGuid', loginRequired, isAdmin, adminController.deactivateUser);

/**
 * @route   PATCH /api/admin/users/:userGuid/activate
 * @desc    Reactivate an inactive user account
 * @access  Administrator
 */
router.patch('/users/:userGuid/activate', loginRequired, isAdmin, adminController.reactivateUser);

/**
 * @route   POST /api/admin/users/:userGuid/reset-password
 * @desc    Trigger a password reset for a specific user
 * @access  Administrator
 */
router.post('/users/:userGuid/reset-password', loginRequired, isAdmin, adminController.resetUserPassword);

/**
 * @route   GET /api/admin/service-lines/:serviceLineId/sll-count
 * @desc    Count active Service Line Leaders for a given service line
 * @access  Administrator
 */
router.get('/service-lines/:serviceLineId/sll-count', loginRequired, isAdmin, adminController.getSllCount);

router.get('/notification-preferences', loginRequired, isAdmin, notifPrefsController.listGlobalPreferences);
router.put('/notification-preferences/:preferenceId', loginRequired, isAdmin, notifPrefsController.updateGlobalPreference);

module.exports = router;
