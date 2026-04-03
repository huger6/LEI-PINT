const express = require('express');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// --- Session Management ---
router.post('/register', annonymousUsersOnly, authController.register);
router.post('/login', annonymousUsersOnly, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', loginRequired, authController.logout);
router.get('/me', loginRequired, authController.me);
router.get('/verify-session', loginRequired, authController.verifySession);

// --- Account confirmation ---
router.get('/confirm-email', authController.confirmEmail);
router.post('/resend-confirmation', authController.resendConfirmation);

// --- Password Recovery ---
router.post('/forgot-password', annonymousUsersOnly, authController.forgotPassword);
router.get('/validate-reset-token/:token', annonymousUsersOnly, authController.validateResetToken);
router.post('/reset-password', annonymousUsersOnly, authController.resetPassword);

// --- Security ---
router.post('/change-password', loginRequired, authController.changePassword);


module.exports = router;