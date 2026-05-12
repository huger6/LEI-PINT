const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired } = require('../middlewares/auth.middleware');
const levelController = require('../controllers/levels.controller');

const badgesRoutes = require('./badges.routes');

// GET /api/levels
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
router.get('/', loginRequired, levelController.getLevels);

// GET /api/levels/:stageCode
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
router.get('/:stageCode', loginRequired, levelController.getLevelByCode);

router.use('/:stageCode/badges', badgesRoutes);

module.exports = router;