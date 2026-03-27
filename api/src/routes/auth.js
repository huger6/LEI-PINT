const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
    res.send('Register');
});


router.post('/login', (req, res) => {
    res.send('Login');
});

router.post('logout', (req, res) => {
    res.send('Login');
});

router.patch('change-password-first-login', (req, res) => {
    res.send('Login');
});

router.post('forgot-password', (req, res) => {
    res.send('Login');
});

router.post('reset-password', (req, res) => {
    res.send('Login');
});

router.get('/confirm-email/:token', (req, res) => {
    res.send('Register');
});


module.exports = router;