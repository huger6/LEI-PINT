const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/statistics.validation');
const statsService = require('../services/statistics.service');
const { uuidRule } = require('../validations/shared-rules');

/*──────────────────────────────────────────────────────────────
  Resolve which consultant a leader/admin wants to inspect.
  Consultants are restricted to themselves; SLL/TM/Admin can
  pass ?userId=, otherwise default to the authenticated user.
──────────────────────────────────────────────────────────────*/
const resolveTargetUserId = async (req) => {
    if (req.user.role === 'Consultant') return req.user.sub;
    const requestedGuid = req.query.userGuid;
    if (requestedGuid) {
        try {
            uuidRule.parse(requestedGuid);
            const user = await models.users.findOne({ where: { user_guid: requestedGuid }, attributes: ['user_id'] });
            if (user) return user.user_id;
        } catch (_) {
            // Invalid GUID — ignore and fall back to authenticated user
        }
    }
    return req.user.sub;
};

/*──────────────────────────────────────────────────────────────
  Resolve the service line ID to scope team queries.
  SLL always uses their own SL; TM/Admin use the optional query param.
  Returns { serviceLineId, unconfigured } — unconfigured is true
  when an SLL has no service line assigned.
──────────────────────────────────────────────────────────────*/
const resolveRequestedServiceLineId = async (req, querySl) => {
    if (req.user.role !== 'Service Line Leader') return { serviceLineId: querySl ?? null };
    const id = await statsService.resolveServiceLineForUser(req.user.sub, 'Service Line Leader');
    return { serviceLineId: id, unconfigured: !id };
};

/*──────────────────────────────────────────────────────────────
  Verify the target user is a consultant. Sets a 404 response
  and returns false if not found so the caller can early-exit.
──────────────────────────────────────────────────────────────*/
const assertConsultantExists = async (res, userId) => {
    const consultant = await models.consultants.findByPk(userId, { attributes: ['user_id'] });
    if (!consultant) {
        res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
        return false;
    }
    return true;
};

/*══════════════════════════════════════════════════════════════
  INDIVIDUAL CONSULTANT
══════════════════════════════════════════════════════════════*/

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultant/learning-paths
  Per-LP progress (badges earned vs total, points, percent).
──────────────────────────────────────────────────────────────*/
const getLearningPathProgress = async (req, res) => {
    try {
        const targetUserId = await resolveTargetUserId(req);
        if (!await assertConsultantExists(res, targetUserId)) return;

        const data = await statsService.getLearningPathProgress(targetUserId);
        return res.status(200).json({ success: true, code: 'STATS_LP_PROGRESS_RETRIEVED', data });

    } catch (error) {
        logger.error('Error fetching learning path progress', { error });
        return res.status(500).json({ success: false, code: 'STATS_LP_PROGRESS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultant/points-history
  Total points + paginated history (badges + requirements).
──────────────────────────────────────────────────────────────*/
const getPointsHistory = async (req, res) => {
    try {
        const { page, limit, search, serviceLineId, areaId, dateFrom, dateTo } = validations.pointsHistoryQuerySchema.parse(req.query);
        const targetUserId = await resolveTargetUserId(req);
        if (!await assertConsultantExists(res, targetUserId)) return;

        const result = await statsService.getPointsHistory(targetUserId, { page, limit, search, serviceLineId, areaId, dateFrom, dateTo });
        return res.status(200).json({
            success: true,
            code: 'STATS_POINTS_HISTORY_RETRIEVED',
            data: { totalPoints: result.totalPoints, history: result.history },
            pagination: result.pagination
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error('Error fetching points history', { error });
        return res.status(500).json({ success: false, code: 'STATS_POINTS_HISTORY_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultant/timeline
  Cumulative skills & certifications acquired per month.
──────────────────────────────────────────────────────────────*/
const getAcquisitionTimeline = async (req, res) => {
    try {
        const targetUserId = await resolveTargetUserId(req);
        if (!await assertConsultantExists(res, targetUserId)) return;

        const data = await statsService.getAcquisitionTimeline(targetUserId);
        return res.status(200).json({ success: true, code: 'STATS_TIMELINE_RETRIEVED', data });

    } catch (error) {
        logger.error('Error fetching acquisition timeline', { error });
        return res.status(500).json({ success: false, code: 'STATS_TIMELINE_FETCH_FAILED' });
    }
};

/*══════════════════════════════════════════════════════════════
  LEADERSHIP / TALENT MANAGEMENT
  Note: role gating is handled by the `leadership` middleware in
  statistics.routes.js — no redundant role checks here.
══════════════════════════════════════════════════════════════*/

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultants/comparison
  Compares the target consultant against peers with similar
  experience (badges within ±tolerance) and overlapping areas.
──────────────────────────────────────────────────────────────*/
const getPeerComparison = async (req, res) => {
    try {
        const { userGuid, tolerance } = validations.peerComparisonQuerySchema.parse(req.query);
        let targetUserId = req.user.sub;
        if (userGuid) {
            const user = await models.users.findOne({ where: { user_guid: userGuid }, attributes: ['user_id'] });
            if (!user) return res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
            targetUserId = user.user_id;
        }
        if (!await assertConsultantExists(res, targetUserId)) return;

        const result = await statsService.getPeerComparison(targetUserId, tolerance);
        return res.status(200).json({ success: true, code: 'STATS_PEER_COMPARISON_RETRIEVED', data: result });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error('Error computing peer comparison', { error });
        return res.status(500).json({ success: false, code: 'STATS_PEER_COMPARISON_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/team/badges-count
  Number of badges acquired across the user's scope. SLL gets
  their own SL automatically; TM/Admin can pass ?serviceLineId.
──────────────────────────────────────────────────────────────*/
const getTeamBadgesCount = async (req, res) => {
    try {
        const { serviceLineId: querySl } = validations.applicationsCountQuerySchema.parse(req.query);
        const { serviceLineId, unconfigured } = await resolveRequestedServiceLineId(req, querySl);
        if (unconfigured) return res.status(403).json({ success: false, code: 'APP_SLL_NOT_CONFIGURED' });

        const data = await statsService.getTeamBadgesCount({ serviceLineId });
        return res.status(200).json({ success: true, code: 'STATS_TEAM_BADGES_RETRIEVED', data: { ...data, serviceLineId } });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error('Error fetching team badges count', { error });
        return res.status(500).json({ success: false, code: 'STATS_TEAM_BADGES_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  Generic helper for application-state count endpoints.
──────────────────────────────────────────────────────────────*/
const buildApplicationsCountHandler = (state, successCode, failureCode) => async (req, res) => {
    try {
        const { serviceLineId: querySl } = validations.applicationsCountQuerySchema.parse(req.query);
        const { serviceLineId, unconfigured } = await resolveRequestedServiceLineId(req, querySl);
        if (unconfigured) return res.status(403).json({ success: false, code: 'APP_SLL_NOT_CONFIGURED' });

        const total = await statsService.getApplicationsCountByState({ serviceLineId, state });
        return res.status(200).json({ success: true, code: successCode, data: { total, state, serviceLineId } });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error(`Error fetching applications count (${state})`, { error });
        return res.status(500).json({ success: false, code: failureCode });
    }
};

const getPendingReviewApplicationsCount = buildApplicationsCountHandler(
    'Submitted',
    'STATS_APPS_PENDING_RETRIEVED',
    'STATS_APPS_PENDING_FAILED'
);

const getOpenApplicationsCount = buildApplicationsCountHandler(
    'Open',
    'STATS_APPS_OPEN_RETRIEVED',
    'STATS_APPS_OPEN_FAILED'
);

/*══════════════════════════════════════════════════════════════
  GENERAL REPORTING
══════════════════════════════════════════════════════════════*/

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/badge-distribution
  Monthly badge percentage grouped by LP / SL / area.
──────────────────────────────────────────────────────────────*/
const getBadgeDistribution = async (req, res) => {
    try {
        const { groupBy, dateFrom, dateTo } = validations.badgeDistributionQuerySchema.parse(req.query);
        const data = await statsService.getBadgeDistributionMonthly({
            groupBy,
            dateFrom: dateFrom ?? null,
            dateTo: dateTo ?? null
        });
        return res.status(200).json({ success: true, code: 'STATS_BADGE_DISTRIBUTION_RETRIEVED', data, meta: { groupBy } });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error('Error fetching badge distribution', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGE_DISTRIBUTION_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/badges-by-range
  Awarded badges in a date range, filterable by LP/SL/area/stage.
──────────────────────────────────────────────────────────────*/
const getBadgesByRange = async (req, res) => {
    try {
        const params = validations.badgesByRangeQuerySchema.parse(req.query);
        const data = await statsService.getBadgesByRange({
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            learningPathId: params.learningPathId ?? null,
            serviceLineId: params.serviceLineId ?? null,
            areaId: params.areaId ?? null,
            stageId: params.stageId ?? null
        });
        return res.status(200).json({ success: true, code: 'STATS_BADGES_BY_RANGE_RETRIEVED', data });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);
        logger.error('Error fetching badges by range', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGES_BY_RANGE_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/badges-by-learning-path
  Total awarded badges grouped by learning path.
──────────────────────────────────────────────────────────────*/
const getBadgesByLearningPath = async (req, res) => {
    try {
        const data = await statsService.getBadgesAwardedByLearningPath();
        return res.status(200).json({ success: true, code: 'STATS_BADGES_BY_LP_RETRIEVED', data });
    } catch (error) {
        logger.error('Error fetching badges by learning path', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGES_BY_LP_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/badges-by-service-line
  Total awarded badges grouped by service line.
──────────────────────────────────────────────────────────────*/
const getBadgesByServiceLine = async (req, res) => {
    try {
        const data = await statsService.getBadgesAwardedByServiceLine();
        return res.status(200).json({ success: true, code: 'STATS_BADGES_BY_SL_RETRIEVED', data });
    } catch (error) {
        logger.error('Error fetching badges by service line', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGES_BY_SL_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/level-distribution
  Awarded badge / consultant counts per progression-stage code.
──────────────────────────────────────────────────────────────*/
const getLevelDistribution = async (req, res) => {
    try {
        const data = await statsService.getLevelDistribution();
        return res.status(200).json({ success: true, code: 'STATS_LEVEL_DISTRIBUTION_RETRIEVED', data });
    } catch (error) {
        logger.error('Error fetching level distribution', { error });
        return res.status(500).json({ success: false, code: 'STATS_LEVEL_DISTRIBUTION_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/user-enrollment
  Aggregate user counts (total, active, role breakdown).
──────────────────────────────────────────────────────────────*/
const getUserEnrollment = async (req, res) => {
    try {
        const data = await statsService.getUserEnrollment();
        return res.status(200).json({ success: true, code: 'STATS_USER_ENROLLMENT_RETRIEVED', data });
    } catch (error) {
        logger.error('Error fetching user enrollment', { error });
        return res.status(500).json({ success: false, code: 'STATS_USER_ENROLLMENT_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultant/badges-per-area
  Per-area breakdown: badges earned and points per area.
──────────────────────────────────────────────────────────────*/
const getBadgesPerArea = async (req, res) => {
    try {
        const targetUserId = await resolveTargetUserId(req);
        if (!await assertConsultantExists(res, targetUserId)) return;

        const data = await statsService.getBadgesPerArea(targetUserId);
        return res.status(200).json({ success: true, code: 'STATS_BADGES_PER_AREA_RETRIEVED', data });

    } catch (error) {
        logger.error('Error fetching badges per area', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGES_PER_AREA_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  POST /api/statistics/admin/reconcile-points
  Runs sp_reconcile_badge_points() to fix missing points records.
──────────────────────────────────────────────────────────────*/
const reconcilePoints = async (req, res) => {
    try {
        await statsService.reconcileBadgePoints();
        return res.status(200).json({ success: true, code: 'STATS_POINTS_RECONCILED' });

    } catch (error) {
        logger.error('Error reconciling badge points', { error });
        return res.status(500).json({ success: false, code: 'STATS_POINTS_RECONCILE_FAILED' });
    }
};

module.exports = {
    getLearningPathProgress,
    getPointsHistory,
    getAcquisitionTimeline,
    getPeerComparison,
    getTeamBadgesCount,
    getPendingReviewApplicationsCount,
    getOpenApplicationsCount,
    getBadgeDistribution,
    getBadgesByRange,
    getBadgesByLearningPath,
    getBadgesByServiceLine,
    getLevelDistribution,
    getUserEnrollment,
    getBadgesPerArea,
    reconcilePoints
};
