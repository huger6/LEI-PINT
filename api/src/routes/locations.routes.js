const express = require('express');
const locationsController = require('../controllers/locations.controller');

const router = express.Router();

// This route should be start with /locations

router.get('/', locationsController.getAvailableLocations);

module.exports = router;