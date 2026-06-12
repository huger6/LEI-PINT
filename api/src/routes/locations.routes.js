const express = require('express');
const locationsController = require('../controllers/locations.controller');

const router = express.Router();

/**
 * @route   GET /api/locations
 * @desc    List all available office/country locations
 * @access  Public
 */
router.get('/', locationsController.getAvailableLocations);

module.exports = router;