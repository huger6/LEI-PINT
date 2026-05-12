const express = require('express');
const langController = require('../controllers/language.controller');

const router = express.Router();

// This route should be start with /languages

router.get('/', langController.getAvailableLanguages);

module.exports = router;