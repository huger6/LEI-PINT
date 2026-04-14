const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const lpController = require('../controllers/learningPaths.controller');


// GET /api/learning-paths
router.get('/', loginRequired, lpController.getAllLearningPaths);

// GET /api/learning-paths/:pathSlug
router.get('/:pathSlug', loginRequired, lpController.getLearningPathBySlug);

module.exports = router;