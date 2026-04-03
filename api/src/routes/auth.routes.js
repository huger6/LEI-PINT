const express = require('express');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();


router.post('/register', annonymousUsersOnly, authController.register);

router.post('/login', annonymousUsersOnly, authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', loginRequired, authController.logout);

router.post('/change-password', loginRequired, authController.changePassword);

router.post('/forgot-password', annonymousUsersOnly, authController.forgotPassword);

router.get('/validate-reset-token/:token', annonymousUsersOnly, authController.validateResetToken);

router.post('/reset-password', annonymousUsersOnly, authController.resetPassword);

router.get('/confirm-email', authController.confirmEmail);

// Route to resend confirmation email

module.exports = router;