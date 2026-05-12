const express = require('express');
const rateLimit = require('express-rate-limit');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// This route should be start with /auth

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'AUTH_RATE_LIMIT_LOGIN' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'AUTH_RATE_LIMIT_REGISTER' }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'AUTH_RATE_LIMIT_FORGOT_PASSWORD' }
});

// --- Session Management ---

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Anonymous only (rate-limited: 5/hour)
 */
router.post('/register', registerLimiter, annonymousUsersOnly, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate and return access + refresh tokens
 * @access  Anonymous only (rate-limited: 10/15 min)
 */
router.post('/login', loginLimiter, annonymousUsersOnly, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Issue a new access token using a valid refresh token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate the current session / refresh token
 * @access  Authenticated
 */
router.post('/logout', loginRequired, authController.logout);

/**
 * @route   GET /api/auth/verify-session
 * @desc    Check whether the current session token is still valid
 * @access  Authenticated
 */
router.get('/verify-session', loginRequired, authController.verifySession);

// --- Account Confirmation ---

/**
 * @route   GET /api/auth/confirm-email
 * @desc    Confirm a user's email address via token from confirmation email
 * @access  Public
 */
router.get('/confirm-email', authController.confirmEmail);

/**
 * @route   POST /api/auth/resend-confirmation
 * @desc    Resend the email confirmation link
 * @access  Public
 */
router.post('/resend-confirmation', authController.resendConfirmation);

// --- Password Recovery ---

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send a password-reset email
 * @access  Anonymous only (rate-limited: 5/hour)
 */
router.post('/forgot-password', forgotPasswordLimiter, annonymousUsersOnly, authController.forgotPassword);

/**
 * @route   GET /api/auth/validate-reset-token/:token
 * @desc    Validate a password-reset token before allowing the reset
 * @access  Anonymous only
 */
router.get('/validate-reset-token/:token', annonymousUsersOnly, authController.validateResetToken);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using a valid reset token
 * @access  Anonymous only
 */
router.post('/reset-password', annonymousUsersOnly, authController.resetPassword);

// --- Security ---

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password while authenticated (requires current password)
 * @access  Authenticated
 */
router.post('/change-password', loginRequired, authController.changePassword);

module.exports = router;
