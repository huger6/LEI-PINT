const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const slController = require('../controllers/serviceLines.controller');

const areasRoutes = require('./areas.routes');
const badgeRoutes = require('./badges.routes');

// GET /api/service-lines
// OR
// GET /api/learning-paths/:pathSlug/service-lines
router.get('/', loginRequired, slController.getServiceLines);

// GET /api/service-lines/check-slug?slug=mySlug
router.get('/check-slug', loginRequired, isAdmin, slController.checkSlugAvailability);

// GET /api/service-lines/:slSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug
router.get('/:slSlug', loginRequired, slController.getServiceLineBySlug);

// POST /api/service-lines/
router.post('/', loginRequired, isAdmin, slController.createServiceLine);

// PUT /api/service-lines/:slSlug
router.put('/:slSlug', loginRequired, isAdmin, slController.updateServiceLine);

// DELETE /api/service-lines/:slSlug
router.delete('/:slSlug', loginRequired, isAdmin, slController.deleteServiceLine);

router.use('/:slSlug/areas', areasRoutes);
router.use('/:slSlug/badges', badgeRoutes);

module.exports = router;