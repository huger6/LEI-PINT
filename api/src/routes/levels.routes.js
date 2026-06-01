const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin, optionalAuth } = require('../middlewares/auth.middleware');
const levelController = require('../controllers/levels.controller');

const badgesRoutes = require('./badges.routes');

/**
 * @route   GET /api/levels
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
 * @desc    List all levels, optionally scoped to an area
 * @access  Authenticated
 */
router.get('/', loginRequired, levelController.getLevels);

/**
 * @route   GET /api/levels/filter-stats
 * @desc    Get max consultant and badge counts for filter bounds
 * @access  Administrator
 */
router.get('/filter-stats', loginRequired, isAdmin, levelController.getFilterStats);

/**
 * @route   GET /api/levels/count
 * @desc    Get total number of active levels
 * @access  Administrator
 */
router.get('/count', loginRequired, isAdmin, levelController.getLevelsCount);

/**
 * @route   GET /api/levels/:stageCode
 *          GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
 * @desc    Get a single level by stage code
 * @access  Authenticated
 */
router.get('/:stageCode', loginRequired, levelController.getLevelByCode);

/**
 * @route   POST /api/levels
 *          POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
 * @desc    Create a new level
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, levelController.createLevel);

/**
 * @route   PUT /api/levels/:stageCode
 *          PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
 * @desc    Update an existing level
 * @access  Administrator
 */
router.put('/:stageCode', loginRequired, isAdmin, levelController.updateLevel);

/**
 * @route   DELETE /api/levels/:stageCode
 *          DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
 * @desc    Delete a level
 * @access  Administrator
 */
router.delete('/:stageCode', loginRequired, isAdmin, levelController.deleteLevel);

/**
 * @route   PATCH /api/levels/:stageCode/activate
 *          PATCH /api/areas/:areaSlug/levels/:stageCode/activate
 * @desc    Reactivate an inactive level
 * @access  Administrator
 */
router.patch('/:stageCode/activate', loginRequired, isAdmin, levelController.reactivateLevel);

router.use('/:stageCode/badges', badgesRoutes);

module.exports = router;
