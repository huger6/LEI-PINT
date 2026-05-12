const express = require('express');
const router = express.Router();

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const lpController = require('../controllers/learningPaths.controller');

const slRoutes = require('./serviceLines.routes');

// GET /api/learning-paths
router.get('/', loginRequired, lpController.getAllLearningPaths);

// GET /api/learning-paths/:pathSlug
router.get('/:pathSlug', loginRequired, lpController.getLearningPathBySlug);

// GET /api/learning-paths/check-slug?slug=mySlug
router.get('/check-slug', loginRequired, isAdmin, lpController.checkSlugAvailability);

// POST /api/learning-paths
router.post('/', loginRequired, isAdmin, lpController.createLearningPath);

// PUT /api/learning-paths/:pathSlug
router.put('/:pathSlug', loginRequired, isAdmin, lpController.updateLearningPath);

// DELETE /api/learning-paths/:pathSlug
router.delete('/:pathSlug', loginRequired, isAdmin, lpController.updateLearningPath);

router.use('/:pathSlug/service-lines', slRoutes);

module.exports = router;