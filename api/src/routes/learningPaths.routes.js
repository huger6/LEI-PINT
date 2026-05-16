const express = require('express');
const router = express.Router();

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const lpController = require('../controllers/learningPaths.controller');

const slRoutes = require('./serviceLines.routes');

/**
 * @route   GET /api/learning-paths
 * @desc    List all learning paths
 * @access  Public
 */
router.get('/', lpController.getAllLearningPaths);

/**
 * @route   GET /api/learning-paths/count
 * @desc    Get total number of active learning paths
 * @access  Administrator
 */
router.get('/count', loginRequired, isAdmin, lpController.getLearningPathsCount);

/**
 * @route   GET /api/learning-paths/check-slug?slug=mySlug
 * @desc    Check whether a given learning path slug is available
 * @access  Administrator
 */
router.get('/check-slug', loginRequired, isAdmin, lpController.checkSlugAvailability);

/**
 * @route   GET /api/learning-paths/:pathSlug
 * @desc    Get a single learning path by slug
 * @access  Authenticated
 */
router.get('/:pathSlug', loginRequired, lpController.getLearningPathBySlug);

/**
 * @route   POST /api/learning-paths
 * @desc    Create a new learning path
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, lpController.createLearningPath);

/**
 * @route   PUT /api/learning-paths/:pathSlug
 * @desc    Update an existing learning path
 * @access  Administrator
 */
router.put('/:pathSlug', loginRequired, isAdmin, lpController.updateLearningPath);

/**
 * @route   DELETE /api/learning-paths/:pathSlug
 * @desc    Delete a learning path
 * @access  Administrator
 */
router.delete('/:pathSlug', loginRequired, isAdmin, lpController.deleteLearningPath);

router.use('/:pathSlug/service-lines', slRoutes);

module.exports = router;
