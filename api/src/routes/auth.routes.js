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
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many registration attempts. Please try again after an hour.' }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many password reset requests. Please try again after an hour.' }
});

// --- Session Management ---
router.post('/register', registerLimiter, annonymousUsersOnly, authController.register);
router.post('/login', loginLimiter, annonymousUsersOnly, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', loginRequired, authController.logout);
router.get('/me', loginRequired, authController.me);
router.get('/verify-session', loginRequired, authController.verifySession);

// --- Account confirmation ---
router.get('/confirm-email', authController.confirmEmail);
router.post('/resend-confirmation', authController.resendConfirmation);

// --- Password Recovery ---
router.post('/forgot-password', forgotPasswordLimiter, annonymousUsersOnly, authController.forgotPassword);
router.get('/validate-reset-token/:token', annonymousUsersOnly, authController.validateResetToken);
router.post('/reset-password', annonymousUsersOnly, authController.resetPassword);

// --- Security ---
router.post('/change-password', loginRequired, authController.changePassword);


module.exports = router;