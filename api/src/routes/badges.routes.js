const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const badgeController = require('../controllers/badges.controller');

/**
 * @route   GET /api/badges
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
 * @desc    List all badges, optionally scoped to a level
 * @access  Authenticated
 */
router.get('/', loginRequired, badgeController.getBadges);

/**
 * @route   GET /api/badges/check-slug?slug=mySlug
 * @desc    Check whether a given badge slug is available
 * @access  Administrator
 */
router.get('/check-slug', loginRequired, isAdmin, badgeController.checkSlugAvailability);

/**
 * @route   GET /api/badges/:badgeSlug
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges/:badgeSlug
 * @desc    Get a single badge by slug
 * @access  Authenticated
 */
router.get('/:badgeSlug', loginRequired, badgeController.getBadgeBySlug);

/**
 * @route   POST /api/badges
 * @desc    Create a new badge
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, badgeController.createBadge);

/**
 * @route   PUT /api/badges/:badgeSlug
 * @desc    Update an existing badge
 * @access  Administrator
 */
router.put('/:badgeSlug', loginRequired, isAdmin, badgeController.updateBadge);

/**
 * @route   DELETE /api/badges/:badgeSlug
 * @desc    Delete a badge
 * @access  Administrator
 */
router.delete('/:badgeSlug', loginRequired, isAdmin, badgeController.deleteBadge);

module.exports = router;
