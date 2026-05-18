const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

const areaController = require('../controllers/areas.controller');

const levelsRoutes = require('./levels.routes');
const badgesRoutes = require('./badges.routes');

/**
 * @route   GET /api/areas
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
 * @desc    List all areas, optionally scoped to a service line
 * @access  Public
 */
router.get('/', areaController.getAreas);

/**
 * @route   GET /api/areas/filter-stats
 * @desc    Get max consultant and level counts for filter bounds
 * @access  Administrator
 */
router.get('/filter-stats', loginRequired, isAdmin, areaController.getFilterStats);

/**
 * @route   GET /api/areas/count
 * @desc    Get total number of active areas
 * @access  Administrator
 */
router.get('/count', loginRequired, isAdmin, areaController.getAreasCount);

/**
 * @route   GET /api/areas/check-slug?slug=mySlug
 * @desc    Check whether a given area slug is available
 * @access  Administrator
 */
router.get('/check-slug', loginRequired, isAdmin, areaController.checkSlugAvailability);

/**
 * @route   GET /api/areas/:areaSlug
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
 * @desc    Get a single area by slug
 * @access  Authenticated
 */
router.get('/:areaSlug', loginRequired, areaController.getAreaBySlug);

/**
 * @route   POST /api/areas
 *          POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
 * @desc    Create a new area
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, areaController.createArea);

/**
 * @route   PUT /api/areas/:areaSlug
 *          PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
 * @desc    Update an existing area
 * @access  Administrator
 */
router.put('/:areaSlug', loginRequired, isAdmin, areaController.updateArea);

/**
 * @route   DELETE /api/areas/:areaSlug
 *          DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
 * @desc    Delete an area
 * @access  Administrator
 */
router.delete('/:areaSlug', loginRequired, isAdmin, areaController.deleteArea);

router.use('/:areaSlug/levels', levelsRoutes);
router.use('/:areaSlug/badges', badgesRoutes);

module.exports = router;
