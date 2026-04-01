const express = require('express');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
// const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');


const router = express.Router();

router.post('/register', annonymousUsersOnly, authController.register);

router.post('/login', annonymousUsersOnly, authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', loginRequired, authController.logout);

router.post('/change-password', loginRequired, authController.changePassword);

//router.post('/forgot-password',);

//router.get('reset-password',);

router.get('/confirm-email', authController.confirmEmail);
// footer shows as "..."

// Route to resend confirmation email

module.exports = router;