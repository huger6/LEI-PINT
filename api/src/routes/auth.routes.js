const express = require('express');
const { annonymousUsersOnly, loginRequired } = require('../middlewares/auth.middleware');
// const validate = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');


const router = express.Router();

router.post('/register', annonymousUsersOnly, authController.register);

router.post('/login', annonymousUsersOnly);

router.post('/logout', loginRequired);

router.post('/change-password', annonymousUsersOnly);

//router.post('/reset-password',);

router.get('/confirm-email', authController.confirmEmail);

// Route to resend confirmation email
// Add route to emailService confirmation email as a 2nd option

module.exports = router;