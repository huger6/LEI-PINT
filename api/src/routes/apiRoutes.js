const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const locations = require('./locations.routes');
const languages = require('./languages.routes');
const learningPaths = require('./learningPaths.routes');
const serviceLines = require('./serviceLines.routes');
const areas = require('./areas.routes');

router.use('/auth', auth);
router.use('/locations', locations);
router.use('/languages', languages);

// --- Structure ---
// Learning Paths
router.use('/learning-paths', learningPaths);
// Service Lines
router.use('/learning-paths/:pathSlug/service-lines', serviceLines); // Specific
router.use('/service-lines', serviceLines); // Generic (to list all)
// Areas
router.use('/learning-paths/:pathSlug/service-lines/:slSlug/areas', areas); // Specific
router.use('/areas', areas); // Generic


module.exports = router;