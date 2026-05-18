const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
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
 * @route   POST /api/admin/users/:userGuid/reset-password
 * @desc    Trigger a password reset for a specific user
 * @access  Administrator
 */
router.post('/users/:userGuid/reset-password', loginRequired, isAdmin, adminController.resetUserPassword);

module.exports = router;
