const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
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

router.use('/:stageCode/badges', badgesRoutes);

module.exports = router;
