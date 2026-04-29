const express = require('express');
const langController = require('../controllers/language.controller');

const router = express.Router();

/**
 * @route   GET /api/languages
 * @desc    List all available i18n languages
 * @access  Public
 */
router.get('/', langController.getAvailableLanguages);

module.exports = router;