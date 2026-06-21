const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/goals.controller');

/**
 * @route   GET /api/goals/stats
 * @desc    Dashboard stats: active objectives, days to next, badges expiring, completed
 * @access  Authenticated
 */
router.get('/stats', loginRequired, ctrl.getGoalStats);

/**
 * @route   GET /api/goals/timeline
 * @desc    Progression timeline: stage codes with earned vs total badges
 * @access  Authenticated
 */
router.get('/timeline', loginRequired, ctrl.getProgressionTimeline);

/**
 * @route   GET /api/goals/calendar
 * @desc    Export the consultant's objectives as an .ics calendar (Teams/Outlook)
 * @access  Authenticated
 */
router.get('/calendar', loginRequired, ctrl.getGoalsCalendar);

/**
 * @route   GET /api/goals
 * @desc    List all goals for the authenticated consultant
 * @access  Authenticated
 */
router.get('/', loginRequired, ctrl.getGoals);

/**
 * @route   POST /api/goals
 * @desc    Create a new goal (link a badge as an objective)
 * @access  Authenticated
 */
router.post('/', loginRequired, ctrl.createGoal);

/**
 * @route   PUT /api/goals/:goalId
 * @desc    Update an existing goal
 * @access  Authenticated (owner only)
 */
router.put('/:goalId', loginRequired, ctrl.updateGoal);

/**
 * @route   DELETE /api/goals/:goalId
 * @desc    Delete a goal
 * @access  Authenticated (owner only)
 */
router.delete('/:goalId', loginRequired, ctrl.deleteGoal);

module.exports = router;
