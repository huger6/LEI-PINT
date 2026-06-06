const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const rankingController = require('../controllers/ranking.controller');

/**
 * @route   GET /api/ranking/my-position
 * @desc    Gets authenticated user's position in the ranking
 * @query   limit, learningPathId, serviceLineId, areaId
 */
router.get('/my-position', loginRequired, rankingController.getMyPosition);

/**
 * @route   GET /api/ranking
 * @desc    Gets global consultants leaderboard or filtered
 * @query   page, limit, learningPathId, serviceLineId, areaId
 */
router.get('/', loginRequired, rankingController.getRanking);

module.exports = router;