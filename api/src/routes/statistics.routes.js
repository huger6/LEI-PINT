const express = require('express');
const router = express.Router();
const { loginRequired, checkRole, leadership } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/statistics.controller');

const adminOnly = checkRole('Administrator');

/*──────────────────────────────────────────────────────────────
  Individual consultant statistics
──────────────────────────────────────────────────────────────*/

/**
 * @route   GET /api/statistics/consultant/learning-paths
 * @desc    Per-LP progress for the authenticated consultant; SLL/TM/Admin may pass ?userId
 * @access  Authenticated
 */
router.get('/consultant/learning-paths', loginRequired, ctrl.getLearningPathProgress);

/**
 * @route   GET /api/statistics/consultant/points-history
 * @desc    Total points and paginated points history
 * @query   page, limit, userId (leaders only)
 * @access  Authenticated
 */
router.get('/consultant/points-history', loginRequired, ctrl.getPointsHistory);

/**
 * @route   GET /api/statistics/consultant/timeline
 * @desc    Cumulative skills + certifications acquired per month
 * @access  Authenticated
 */
router.get('/consultant/timeline', loginRequired, ctrl.getAcquisitionTimeline);

/**
 * @route   GET /api/statistics/consultant/badges-per-area
 * @desc    Per-area breakdown of earned badges and points for a consultant
 * @access  Authenticated
 */
router.get('/consultant/badges-per-area', loginRequired, ctrl.getBadgesPerArea);

/*──────────────────────────────────────────────────────────────
  Service Line Leader / Talent Manager
──────────────────────────────────────────────────────────────*/

/**
 * @route   GET /api/statistics/consultants/comparison
 * @desc    Compare consultant against peers with similar experience and overlapping areas
 * @query   userId (defaults to caller), tolerance (0..1, default 0.25)
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/consultants/comparison', loginRequired, leadership, ctrl.getPeerComparison);

/**
 * @route   GET /api/statistics/team/badges-count
 * @desc    Number of badges acquired in scope (SLL: own SL; TM/Admin: optional ?serviceLineId)
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/team/badges-count', loginRequired, leadership, ctrl.getTeamBadgesCount);

/**
 * @route   GET /api/statistics/team/applications-pending
 * @desc    Count of applications awaiting review (state = 'Submitted')
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/team/applications-pending', loginRequired, leadership, ctrl.getPendingReviewApplicationsCount);

/**
 * @route   GET /api/statistics/team/applications-open
 * @desc    Count of applications in 'Open' state
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/team/applications-open', loginRequired, leadership, ctrl.getOpenApplicationsCount);

/*──────────────────────────────────────────────────────────────
  General reporting
──────────────────────────────────────────────────────────────*/

/**
 * @route   GET /api/statistics/reports/badge-distribution
 * @desc    Monthly badge distribution percentage by learning_path | service_line | area
 * @query   groupBy, dateFrom, dateTo
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/badge-distribution', loginRequired, leadership, ctrl.getBadgeDistribution);

/**
 * @route   GET /api/statistics/reports/badges-by-range
 * @desc    Awarded badges in a date range, filterable by LP/SL/area/stage
 * @query   dateFrom, dateTo, learningPathId, serviceLineId, areaId, stageId
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/badges-by-range', loginRequired, leadership, ctrl.getBadgesByRange);

/**
 * @route   GET /api/statistics/reports/badges-by-learning-path
 * @desc    Awarded badge counts per learning path
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/badges-by-learning-path', loginRequired, leadership, ctrl.getBadgesByLearningPath);

/**
 * @route   GET /api/statistics/reports/badges-by-service-line
 * @desc    Awarded badge counts per service line
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/badges-by-service-line', loginRequired, leadership, ctrl.getBadgesByServiceLine);

/**
 * @route   GET /api/statistics/reports/level-distribution
 * @desc    Awarded badge distribution by progression-stage level
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/level-distribution', loginRequired, leadership, ctrl.getLevelDistribution);

/**
 * @route   GET /api/statistics/reports/user-enrollment
 * @desc    Aggregate user counts (total, active, by role)
 * @access  Service Line Leader, Talent Manager, Administrator
 */
router.get('/reports/user-enrollment', loginRequired, leadership, ctrl.getUserEnrollment);

/*──────────────────────────────────────────────────────────────
  Admin maintenance
──────────────────────────────────────────────────────────────*/

/**
 * @route   POST /api/statistics/admin/reconcile-points
 * @desc    Run sp_reconcile_badge_points() to insert missing badge-completion points
 * @access  Administrator
 */
router.post('/admin/reconcile-points', loginRequired, adminOnly, ctrl.reconcilePoints);

module.exports = router;
