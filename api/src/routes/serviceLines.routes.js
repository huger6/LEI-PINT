const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, optionalAuth, isAdmin } = require('../middlewares/auth.middleware');
const slController = require('../controllers/serviceLines.controller');

const areasRoutes = require('./areas.routes');
const badgeRoutes = require('./badges.routes');

/**
 * @route   GET /api/service-lines
 *          GET /api/learning-paths/:pathSlug/service-lines
 * @desc    List all service lines, optionally scoped to a learning path
 * @access  Authenticated
 */
router.get('/', loginRequired, slController.getServiceLines);

/**
 * @route   GET /api/service-lines/filter-stats
 * @desc    Get max consultant and area counts for filter bounds
 * @access  Administrator
 */
router.get('/filter-stats', loginRequired, isAdmin, slController.getFilterStats);

/**
 * @route   GET /api/service-lines/count
 * @desc    Get total number of active service lines
 * @access  Administrator
 */
router.get('/count', loginRequired, isAdmin, slController.getServiceLinesCount);

/**
 * @route   GET /api/service-lines/check-slug?slug=mySlug
 * @desc    Check whether a given service line slug is available
 * @access  Administrator
 */
router.get('/check-slug', loginRequired, isAdmin, slController.checkSlugAvailability);

/**
 * @route   GET /api/service-lines/:slSlug
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug
 * @desc    Get a single service line by slug
 * @access  Authenticated
 */
router.get('/:slSlug', loginRequired, slController.getServiceLineBySlug);

/**
 * @route   POST /api/service-lines
 * @desc    Create a new service line
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, slController.createServiceLine);

/**
 * @route   PUT /api/service-lines/:slSlug
 * @desc    Update an existing service line
 * @access  Administrator
 */
router.put('/:slSlug', loginRequired, isAdmin, slController.updateServiceLine);

/**
 * @route   DELETE /api/service-lines/:slSlug
 * @desc    Delete a service line
 * @access  Administrator
 */
router.delete('/:slSlug', loginRequired, isAdmin, slController.deleteServiceLine);

/**
 * @route   PATCH /api/service-lines/:slSlug/activate
 * @desc    Reactivate an inactive service line
 * @access  Administrator
 */
router.patch('/:slSlug/activate', loginRequired, isAdmin, slController.reactivateServiceLine);

router.use('/:slSlug/areas', areasRoutes);
router.use('/:slSlug/badges', badgeRoutes);

module.exports = router;
