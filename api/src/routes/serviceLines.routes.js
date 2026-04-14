const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired } = require('../middlewares/auth.middleware');
const slController = require('../controllers/serviceLines.controller');

// GET /api/service-lines
// OR
// GET /api/learning-paths/:pathSlug/service-lines
router.get('/', loginRequired, slController.getServiceLines);

// GET /api/service-lines/:slSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug
router.get('/:slSlug', loginRequired, slController.getServiceLineBySlug);

module.exports = router;