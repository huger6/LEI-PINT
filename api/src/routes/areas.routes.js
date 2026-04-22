const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired } = require('../middlewares/auth.middleware');

const areaController = require('../controllers/areas.controller');

const levelsRoutes = require('./levels.routes');
const badgesRoutes = require('./badges.routes');

// GET /api/areas
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
router.get('/', areaController.getAreas);


// GET /api/areas/:areaSlug
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
router.get('/:areaSlug', loginRequired, areaController.getAreaBySlug);

router.use('/:areaSlug/levels', levelsRoutes);
router.use('/:areaSlug/badges', badgesRoutes);

module.exports = router;