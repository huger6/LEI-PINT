const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

const areaController = require('../controllers/areas.controller');

const levelsRoutes = require('./levels.routes');
const badgesRoutes = require('./badges.routes');

// GET /api/areas
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
router.get('/', areaController.getAreas);

// GET /api/areas/check-slug?slug=mySlug
router.get('/check-slug', loginRequired, isAdmin, areaController.checkSlugAvailability);

// GET /api/areas/:areaSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
router.get('/:areaSlug', loginRequired, areaController.getAreaBySlug);

// POST /api/areas
// OR
// POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
router.post('/', loginRequired, isAdmin, areaController.createArea);

// PUT /api/areas/:areaSlug
// OR
// PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
router.put('/:areaSlug', loginRequired, isAdmin, areaController.updateArea);

// DELETE /api/areas/:areaSlug
// OR
// DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
router.delete('/:areaSlug', loginRequired, isAdmin, areaController.deleteArea);

router.use('/:areaSlug/levels', levelsRoutes);
router.use('/:areaSlug/badges', badgesRoutes);

module.exports = router;
