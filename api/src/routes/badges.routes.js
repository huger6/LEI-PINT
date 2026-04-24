const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const badgeController = require('../controllers/badges.controller');

// GET /api/badges
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
router.get('/', loginRequired, badgeController.getBadges);

// GET /api/badges/check-slug?slug=mySlug
router.get('/check-slug', loginRequired, isAdmin, badgeController.checkSlugAvailability);

// GET /api/badges/:badgeSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges/:badgeSlug
router.get('/:badgeSlug', loginRequired, badgeController.getBadgeBySlug);

// POST /api/badges
// OR nested route equivalents
router.post('/', loginRequired, isAdmin, badgeController.createBadge);

// PUT /api/badges/:badgeSlug
// OR nested route equivalents
router.put('/:badgeSlug', loginRequired, isAdmin, badgeController.updateBadge);

// DELETE /api/badges/:badgeSlug
// OR nested route equivalents
router.delete('/:badgeSlug', loginRequired, isAdmin, badgeController.deleteBadge);

module.exports = router;
