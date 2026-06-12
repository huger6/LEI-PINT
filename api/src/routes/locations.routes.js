const express = require('express');
const { optionalAuth } = require('../middlewares/auth.middleware');
const locationsController = require('../controllers/locations.controller');

const router = express.Router();

/**
 * @route   GET /api/locations
 * @desc    List all available office/country locations
 * @access  Public
 */
router.get('/', optionalAuth, locationsController.getAvailableLocations);

module.exports = router;