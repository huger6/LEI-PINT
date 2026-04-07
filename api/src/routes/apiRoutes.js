const express = require('express');
const router = express.Router();
const auth = require('./auth.routes');
const locations = require('./locations.routes');
const languages = require('./languages.routes');

router.use('/auth', auth);
router.use('/locations', locations);
router.use('/languages', languages);

module.exports = router;