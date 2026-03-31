const express = require('express');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
// const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');


const router = express.Router();

router.post('/register', annonymousUsersOnly, authController.register);

router.post('/login', annonymousUsersOnly);

router.post('/logout', loginRequired);

router.patch('/change-password-first-login', loginRequired);

router.post('/forgot-password', annonymousUsersOnly);

//router.post('/reset-password',);

router.get('/confirm-email', authController.confirmEmail);

// Route to resend confirmation email

module.exports = router;