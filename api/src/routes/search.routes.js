const express = require('express');

const { loginRequired } = require('../middlewares/auth.middleware');
const searchController = require('../controllers/search.controller');

const router = express.Router();

// GET /api/search?q=ana&page=1&limit=10
router.get('/', loginRequired, searchController.search);

module.exports = router;