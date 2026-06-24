const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const me = require('./user.routes');
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
const gamification = require('./gamification.routes');
const notifications = require('./notifications.routes');
const statistics = require('./statistics.routes');
const slas = require('./slas.routes');
const announcements = require('./announcements.routes');
const goals = require('./goals.routes');
const search = require('./search.routes');
const exportsRoutes = require('./exports.routes');
const gdpr = require('./gdpr.routes');
const integrations = require('./integrations.routes');
const translation = require('./translation.routes');

// --- Auth & user session ---
router.use('/auth', auth);
router.use('/me', me);

// --- Reference data ---
router.use('/locations', locations);
router.use('/languages', languages);

// --- Structure (learning path hierarchy) ---
router.use('/learning-paths', learningPaths);  // also nests /service-lines, /areas, /levels, /badges
router.use('/service-lines', serviceLines);     // also nests /areas, /badges
router.use('/areas', areas);                    // also nests /levels, /badges
router.use('/levels', levels);                  // also nests /badges
router.use('/badges', badges);

// --- Applications & workflow ---
router.use('/applications', applications);
router.use('/goals', goals);

// --- Gamification & rankings ---
router.use('/ranking', ranking);
router.use('/gamification', gamification);
router.use('/rewards', require('./rewards.routes'));
router.use('/notifications', notifications);
router.use('/statistics', statistics);

// --- SLAs & Announcements ---
router.use('/slas', slas);
router.use('/announcements', announcements);
router.use('/search', search);
router.use('/exports', exportsRoutes);

// --- Utilities & admin ---
router.use('/utils', utils);
router.use('/admin', admin);
router.use('/gdpr', gdpr);
router.use('/integrations', integrations);

// --- Translation ---
router.use('/translate', translation);

// --- Public (no auth) ---
router.use('/public', require('./publicCatalog.routes'));

module.exports = router;
