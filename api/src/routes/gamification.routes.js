const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const gamificationController = require('../controllers/gamification.controller');

/**
 * @route   POST /api/gamification/interactions
 * @desc    Record a badge interaction (VIEW, FAVORITE, SHARE_LINKEDIN)
 * @access  Consultant (any authenticated user)
 */
router.post('/interactions', loginRequired, gamificationController.trackInteraction);

/**
 * @route   GET /api/gamification/interactions
 * @desc    Get authenticated user's badge interaction history
 * @access  Any authenticated user
 */
router.get('/interactions', loginRequired, gamificationController.getInteractions);

/**
 * @route   GET /api/gamification/points
 * @desc    Get the authenticated consultant's total points and ledger
 * @access  Consultant only
 */
router.get('/points', loginRequired, gamificationController.getPointsSummary);

/**
 * @route   GET /api/gamification/points/:userId
 * @desc    Get a specific consultant's points summary (Admin / TM only)
 * @access  Administrator, Talent Manager
 */
router.get('/points/:userId', loginRequired, gamificationController.getConsultantPointsById);

/**
 * @route   GET /api/gamification/recommendations
 * @desc    Get personalised badge recommendations for the authenticated consultant
 * @access  Consultant only
 */
router.get('/recommendations', loginRequired, gamificationController.getRecommendations);

module.exports = router;
