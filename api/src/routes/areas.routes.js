const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired } = require('../middlewares/auth.middleware');

const areaController = require('../controllers/areas.controller');


// GET /api/areas
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
router.get('/', loginRequired, areaController.getAreas);


// GET /api/areas/:areaSlug
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
router.get('/:areaSlug', loginRequired, areaController.getAreaBySlug);

module.exports = router;