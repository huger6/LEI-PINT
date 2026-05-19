const express = require('express');
const { loginRequired } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

// This route should be start with /me

/**
 * @route   GET /api/me
 * @desc    Return the authenticated user's profile
 * @access  Authenticated
 */
router.get('/', loginRequired, userController.me);

/**
 * @route   PUT /api/me
 * @desc    Update the authenticated user's profile
 * @access  Authenticated
 */
router.put('/', loginRequired, userController.updateProfile);

/**
 * @route   PATCH /api/me/language/:id
 * @desc    Change the authenticated user's preferred language
 * @access  Authenticated
 */
router.patch('/language/:id', loginRequired, userController.changeLanguage);

/**
 * @route   PUT /api/me/accept-share-gdpr
 * @desc    Accept GDPR consent for badge sharing
 * @access  Consultant only
 */
router.put('/accept-share-gdpr', loginRequired, userController.acceptShareGdpr);

module.exports = router;
