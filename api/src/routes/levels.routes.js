const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
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

// POST /api/levels
// OR
// POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
router.post('/', loginRequired, isAdmin, levelController.createLevel);

// PUT /api/levels/:stageCode
// OR
// PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
router.put('/:stageCode', loginRequired, isAdmin, levelController.updateLevel);

// DELETE /api/levels/:stageCode
// OR
// DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
router.delete('/:stageCode', loginRequired, isAdmin, levelController.deleteLevel);

router.use('/:stageCode/badges', badgesRoutes);

module.exports = router;
