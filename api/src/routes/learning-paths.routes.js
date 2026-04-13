const express = require('express');
const { loginRequired } = require('../middlewares/auth.middleware');
const lpController = require('../controllers/learning-paths.controller');

const router = express.Router();

// This route should be start with /learning-paths

router.get('/', loginRequired, lpController.getAvailableLearningPaths);

module.exports = router;