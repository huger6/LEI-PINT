const express = require('express');
const router = express.Router();

const { loginRequired } = require('../middlewares/auth.middleware');
const lpController = require('../controllers/learningPaths.controller');

const slRoutes = require('./serviceLines.routes');

// GET /api/learning-paths
router.get('/', loginRequired, lpController.getAllLearningPaths);

// GET /api/learning-paths/:pathSlug
router.get('/:pathSlug', loginRequired, lpController.getLearningPathBySlug);

router.use('/:pathSlug', slRoutes);

module.exports = router;