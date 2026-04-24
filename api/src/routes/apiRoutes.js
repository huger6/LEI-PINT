const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const locations = require('./locations.routes');
const languages = require('./languages.routes');
const learningPaths = require('./learningPaths.routes');
const serviceLines = require('./serviceLines.routes');
const areas = require('./areas.routes');
const levels = require('./levels.routes');
const badges = require('./badges.routes');
const applications = require('./applications.routes');
const ranking = require('./ranking.routes');
const utils = require('./utils.routes');
const admin = require('./admin.routes');

router.use('/auth', auth);
router.use('/locations', locations);
router.use('/languages', languages);

// --- Structure ---
router.use('/learning-paths', learningPaths);
router.use('/service-lines', serviceLines);
router.use('/areas', areas);
router.use('/levels', levels);
router.use('/badges', badges);
router.use('/applications', applications);
router.use('/ranking', ranking);
router.use('/utils', utils);
router.use('/admin', admin);

module.exports = router;
