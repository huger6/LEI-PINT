const { models, sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/statistics.validation');
const statsService = require('../services/statistics.service');
const { uuidRule } = require('../validations/shared-rules');

/*──────────────────────────────────────────────────────────────
  Authorize a leader inspecting a specific consultant.
  Talent Manager / Administrator are global; a Service Line Leader
  may only inspect consultants within their own Service Line.
  Writes a 403 and returns false when out of scope.
──────────────────────────────────────────────────────────────*/
const enforceLeaderScope = async (req, res, targetUserId) => {
    if (req.user.role !== 'Service Line Leader') return true; // TM/Admin global
    if (targetUserId === req.user.sub) return true;           // inspecting self
    const slId = await statsService.resolveServiceLineForUser(req.user.sub, 'Service Line Leader');
    const inScope = await statsService.isConsultantInServiceLine(targetUserId, slId);
    if (!inScope) {
        res.status(403).json({ success: false, code: 'STATS_CONSULTANT_OUT_OF_SCOPE' });
        return false;
    }
    return true;
};

/*──────────────────────────────────────────────────────────────
  Resolve which consultant a leader/admin wants to inspect.
  Consultants are restricted to themselves; TM/Admin may pass any
  ?userGuid; a Service Line Leader is restricted to their own SL.
  Returns the target user_id, or null when the request was denied
  (a 403 has already been written) so the caller can early-exit.
──────────────────────────────────────────────────────────────*/
const resolveTargetUserId = async (req, res) => {
    if (req.user.role === 'Consultant') return req.user.sub;
    const requestedGuid = req.query.userGuid;
    if (!requestedGuid) return req.user.sub;

    let target;
    try {
        uuidRule.parse(requestedGuid);
        target = await models.users.findOne({ where: { user_guid: requestedGuid }, attributes: ['user_id'] });
    } catch (_) {
        return req.user.sub; // Invalid GUID — fall back to the authenticated user
    }
    if (!target) return req.user.sub;

    if (!await enforceLeaderScope(req, res, target.user_id)) return null;
    return target.user_id;
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
        const targetUserId = await resolveTargetUserId(req, res);
        if (targetUserId === null) return;
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
        const targetUserId = await resolveTargetUserId(req, res);
        if (targetUserId === null) return;
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
        const targetUserId = await resolveTargetUserId(req, res);
        if (targetUserId === null) return;
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
        // A Service Line Leader may only compare consultants within their own SL.
        if (!await enforceLeaderScope(req, res, targetUserId)) return;
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
        const f = validations.badgesSummaryQuerySchema.parse(req.query);
        const data = await statsService.getBadgesAwardedByLearningPath(f);
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
        const f = validations.badgesSummaryQuerySchema.parse(req.query);
        const data = await statsService.getBadgesAwardedByServiceLine(f);
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
        const f = validations.badgesSummaryQuerySchema.parse(req.query);
        const data = await statsService.getLevelDistribution(f);
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
  GET /api/statistics/reports/applications-by-state
  Platform-wide count of badge applications grouped by workflow state.
  Administrator only.
──────────────────────────────────────────────────────────────*/
const APPLICATION_STATES = ['Open', 'Submitted', 'In validation', 'Accepted', 'Rejected'];

const getApplicationsByState = async (req, res) => {
    try {
        const rows = await sequelize.query(
            `SELECT application_state, COUNT(*)::int AS count
             FROM badge_applications
             GROUP BY application_state`,
            { type: QueryTypes.SELECT }
        );
        const counts = new Map(rows.map((r) => [r.application_state, r.count]));
        // Return every state (including zero) in canonical order for a stable chart.
        const data = APPLICATION_STATES.map((state) => ({ state, count: counts.get(state) ?? 0 }));
        return res.status(200).json({ success: true, code: 'STATS_APPLICATIONS_BY_STATE_RETRIEVED', data });
    } catch (error) {
        logger.error('Error fetching applications by state', { error });
        return res.status(500).json({ success: false, code: 'STATS_APPLICATIONS_BY_STATE_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/consultant/badges-per-area
  Per-area breakdown: badges earned and points per area.
──────────────────────────────────────────────────────────────*/
const getBadgesPerArea = async (req, res) => {
    try {
        const targetUserId = await resolveTargetUserId(req, res);
        if (targetUserId === null) return;
        if (!await assertConsultantExists(res, targetUserId)) return;

        const data = await statsService.getBadgesPerArea(targetUserId);
        return res.status(200).json({ success: true, code: 'STATS_BADGES_PER_AREA_RETRIEVED', data });

    } catch (error) {
        logger.error('Error fetching badges per area', { error });
        return res.status(500).json({ success: false, code: 'STATS_BADGES_PER_AREA_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/reports/expiring-badges
  Awarded badges whose expiration_at falls within the next N days.
──────────────────────────────────────────────────────────────*/
const getExpiringBadges = async (req, res) => {
    try {
        const { withinDays } = validations.expiringBadgesQuerySchema.parse(req.query);
        const data = await statsService.getExpiringBadges({ withinDays });
        return res.status(200).json({ success: true, code: 'STATS_EXPIRING_BADGES_RETRIEVED', data, meta: { withinDays } });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');

        logger.error('Error fetching expiring badges', { error });
        return res.status(500).json({ success: false, code: 'STATS_EXPIRING_BADGES_FAILED' });
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

/*──────────────────────────────────────────────────────────────
  Consultants overview (leadership): one row per consultant with
  progress columns (points, badges, applications, last login,
  service line, primary area). SLL is scoped to their Service Line.
  Supports search, service line / area / points filters and sort.
──────────────────────────────────────────────────────────────*/
const CONSULTANTS_IN_SL_SUBQUERY =
    '(SELECT ca.user_id FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.service_line_id = :serviceLineId)';

const getConsultantsOverview = async (req, res) => {
    try {
        let q;
        try { q = validations.consultantsOverviewQuerySchema.parse(req.query); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');
            throw error;
        }

        // Service Line Leaders are scoped to their own Service Line.
        let scopeServiceLineId = q.serviceLineId ?? null;
        if (req.user.role === 'Service Line Leader') {
            const slRows = await sequelize.query(
                'SELECT service_line_id FROM service_line_leaders WHERE user_id = :userId',
                { replacements: { userId: req.user.sub }, type: QueryTypes.SELECT }
            );
            scopeServiceLineId = slRows[0]?.service_line_id ?? -1; // -1 => no SL, returns nothing
        }

        const replacements = {};
        const baseFilters = ["u.user_role = 'Consultant'", 'u.is_active = TRUE'];

        if (scopeServiceLineId != null) {
            replacements.serviceLineId = scopeServiceLineId;
            baseFilters.push(`u.user_id IN ${CONSULTANTS_IN_SL_SUBQUERY}`);
        }
        if (q.areaId) {
            replacements.areaId = q.areaId;
            baseFilters.push('EXISTS (SELECT 1 FROM consultant_areas ca WHERE ca.user_id = u.user_id AND ca.area_id = :areaId)');
        }
        if (q.search) {
            replacements.search = `%${q.search}%`;
            baseFilters.push('u.full_name ILIKE :search');
        }

        const sql = `
            WITH consultant_base AS (
                SELECT
                    u.user_guid,
                    u.full_name,
                    u.profile_img_url,
                    u.last_login_at,
                    (SELECT a.area_name FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id
                        WHERE ca.user_id = u.user_id AND ca.is_primary = TRUE LIMIT 1) AS primary_area_name,
                    (SELECT sl.service_line_name FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id
                        JOIN service_lines sl ON sl.service_line_id = a.service_line_id
                        WHERE ca.user_id = u.user_id AND ca.is_primary = TRUE LIMIT 1) AS service_line_name,
                    COALESCE((SELECT SUM(ph.points_delta) FROM points_history ph WHERE ph.user_id = u.user_id), 0) AS total_points,
                    (SELECT COUNT(*) FROM awarded_badges ab WHERE ab.user_id = u.user_id) AS total_badges,
                    (SELECT COUNT(*) FROM badge_applications ba WHERE ba.user_id = u.user_id) AS applications_count,
                    (SELECT COUNT(*) FROM badge_applications ba WHERE ba.user_id = u.user_id
                        AND ba.application_state NOT IN ('Accepted', 'Rejected')) AS open_applications_count
                FROM users u
                INNER JOIN consultants c ON c.user_id = u.user_id
                WHERE ${baseFilters.join(' AND ')}
            )
            SELECT * FROM consultant_base WHERE 1=1
            ${q.pointsMin != null ? 'AND total_points >= :pointsMin' : ''}
            ${q.pointsMax != null ? 'AND total_points <= :pointsMax' : ''}
        `;
        if (q.pointsMin != null) replacements.pointsMin = q.pointsMin;
        if (q.pointsMax != null) replacements.pointsMax = q.pointsMax;

        let rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

        // Sort (computed columns) then paginate in app — consultant counts are small.
        const sorters = {
            points_desc: (a, b) => b.total_points - a.total_points || a.full_name.localeCompare(b.full_name),
            points_asc: (a, b) => a.total_points - b.total_points || a.full_name.localeCompare(b.full_name),
            name: (a, b) => a.full_name.localeCompare(b.full_name),
            last_login: (a, b) => new Date(b.last_login_at || 0) - new Date(a.last_login_at || 0),
        };
        rows.sort(sorters[q.sort] || sorters.points_desc);

        const totalItems = rows.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / q.limit));
        const start = (q.page - 1) * q.limit;
        const pageRows = rows.slice(start, start + q.limit).map((r) => ({
            ...r,
            total_points: Number(r.total_points),
            total_badges: Number(r.total_badges),
            applications_count: Number(r.applications_count),
            open_applications_count: Number(r.open_applications_count),
        }));

        return res.status(200).json({
            success: true,
            data: pageRows,
            pagination: { totalItems, totalPages, currentPage: q.page, limit: q.limit }
        });
    } catch (error) {
        logger.error('Error fetching consultants overview', { error });
        return res.status(500).json({ success: false, code: 'STATISTICS_CONSULTANTS_OVERVIEW_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  Badges summary KPIs (leadership): total awarded, standard vs
  premium (Special), and the approval rate. SLL scoped to own SL.
  Filterable by service line / area / awarded date range.
──────────────────────────────────────────────────────────────*/
const getBadgesSummary = async (req, res) => {
    try {
        let q;
        try { q = validations.badgesSummaryQuerySchema.parse(req.query); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');
            throw error;
        }

        let scopeServiceLineId = q.serviceLineId ?? null;
        if (req.user.role === 'Service Line Leader') {
            const slRows = await sequelize.query(
                'SELECT service_line_id FROM service_line_leaders WHERE user_id = :userId',
                { replacements: { userId: req.user.sub }, type: QueryTypes.SELECT }
            );
            scopeServiceLineId = slRows[0]?.service_line_id ?? -1;
        }

        const repl = {};
        const badgeFilters = [];
        if (scopeServiceLineId != null) { repl.serviceLineId = scopeServiceLineId; badgeFilters.push('b.service_line_id = :serviceLineId'); }
        if (q.areaId) { repl.areaId = q.areaId; badgeFilters.push('b.area_id = :areaId'); }
        if (q.learningPathId) { repl.learningPathId = q.learningPathId; badgeFilters.push('b.learning_path_id = :learningPathId'); }
        const badgeWhere = badgeFilters.length ? ` AND ${badgeFilters.join(' AND ')}` : '';

        const awardedDate = [];
        if (q.dateFrom) { repl.dateFrom = q.dateFrom; awardedDate.push('ab.awarded_at >= :dateFrom'); }
        if (q.dateTo) { repl.dateTo = q.dateTo; awardedDate.push('ab.awarded_at <= :dateTo'); }
        const awardedWhere = awardedDate.length ? ` AND ${awardedDate.join(' AND ')}` : '';

        const [badgeRows] = await sequelize.query(
            `SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE b.badge_type = 'Special')::int AS premium
             FROM awarded_badges ab
             JOIN badge_applications ba ON ba.application_id = ab.application_id
             JOIN badges b ON b.badge_id = ba.badge_id
             WHERE 1=1${badgeWhere}${awardedWhere}`,
            { replacements: repl }
        );

        const appDate = [];
        if (q.dateFrom) appDate.push('ba.validated_at >= :dateFrom');
        if (q.dateTo) appDate.push('ba.validated_at <= :dateTo');
        const appWhere = appDate.length ? ` AND ${appDate.join(' AND ')}` : '';

        const [appRows] = await sequelize.query(
            `SELECT
                COUNT(*) FILTER (WHERE ba.application_state = 'Accepted')::int AS accepted,
                COUNT(*) FILTER (WHERE ba.application_state = 'Rejected')::int AS rejected
             FROM badge_applications ba
             JOIN badges b ON b.badge_id = ba.badge_id
             WHERE 1=1${badgeWhere}${appWhere}`,
            { replacements: repl }
        );

        const total = Number(badgeRows[0]?.total || 0);
        const premium = Number(badgeRows[0]?.premium || 0);
        const accepted = Number(appRows[0]?.accepted || 0);
        const rejected = Number(appRows[0]?.rejected || 0);
        const approvalRate = accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0;

        return res.status(200).json({
            success: true,
            data: { total, standard: total - premium, premium, accepted, rejected, approvalRate }
        });
    } catch (error) {
        logger.error('Error fetching badges summary', { error });
        return res.status(500).json({ success: false, code: 'STATISTICS_BADGES_SUMMARY_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/statistics/team/recent-activity
  A single chronological feed mixing recent team events (awarded
  badges + submitted applications) across all consultants. SLL is
  scoped to their own Service Line; TM/Admin see everything (or an
  optional ?serviceLineId). ?limit caps the number of events.
──────────────────────────────────────────────────────────────*/
const getTeamRecentActivity = async (req, res) => {
    try {
        const querySl = req.query.serviceLineId ? Number(req.query.serviceLineId) : null;
        const { serviceLineId, unconfigured } = await resolveRequestedServiceLineId(req, querySl);
        if (unconfigured) {
            return res.status(200).json({ success: true, data: [] });
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);
        const replacements = { limit };
        const slFilter = serviceLineId != null ? 'AND b.service_line_id = :serviceLineId' : '';
        if (serviceLineId != null) replacements.serviceLineId = serviceLineId;

        const sql = `
            (
                SELECT
                    'badge_awarded' AS event_type,
                    ab.awarded_at AS event_at,
                    u.full_name AS consultant_name,
                    u.user_guid AS consultant_guid,
                    b.badge_title,
                    b.badge_slug,
                    a.area_name
                FROM awarded_badges ab
                JOIN badge_applications ba ON ba.application_id = ab.application_id
                JOIN badges b ON b.badge_id = ba.badge_id
                JOIN consultants c ON c.user_id = ab.user_id
                JOIN users u ON u.user_id = c.user_id
                LEFT JOIN areas a ON a.area_id = b.area_id
                WHERE 1=1 ${slFilter}
            )
            UNION ALL
            (
                SELECT
                    'application_submitted' AS event_type,
                    ba.submitted_at AS event_at,
                    u.full_name AS consultant_name,
                    u.user_guid AS consultant_guid,
                    b.badge_title,
                    b.badge_slug,
                    a.area_name
                FROM badge_applications ba
                JOIN badges b ON b.badge_id = ba.badge_id
                JOIN consultants c ON c.user_id = ba.user_id
                JOIN users u ON u.user_id = c.user_id
                LEFT JOIN areas a ON a.area_id = b.area_id
                WHERE ba.submitted_at IS NOT NULL ${slFilter}
            )
            ORDER BY event_at DESC
            LIMIT :limit
        `;

        const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
        return res.status(200).json({ success: true, data: rows });

    } catch (error) {
        logger.error('Error fetching team recent activity', { error });
        return res.status(500).json({ success: false, code: 'STATS_RECENT_ACTIVITY_FAILED' });
    }
};

module.exports = {
    getLearningPathProgress,
    getPointsHistory,
    getAcquisitionTimeline,
    getPeerComparison,
    getTeamBadgesCount,
    getTeamRecentActivity,
    getPendingReviewApplicationsCount,
    getOpenApplicationsCount,
    getBadgeDistribution,
    getBadgesByRange,
    getBadgesByLearningPath,
    getBadgesByServiceLine,
    getLevelDistribution,
    getUserEnrollment,
    getApplicationsByState,
    getBadgesPerArea,
    getExpiringBadges,
    getConsultantsOverview,
    getBadgesSummary,
    reconcilePoints
};
