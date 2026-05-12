const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired } = require('../middlewares/auth.middleware');
const badgeController = require('../controllers/badges.controller');

// GET /api/badges
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
router.get('/', loginRequired, badgeController.getBadges);

// GET /api/badges/:badgeSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges/:badgeSlug
router.get('/:badgeSlug', loginRequired, badgeController.getBadgeBySlug);

module.exports = router;