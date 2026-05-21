const { models, sequelize } = require('../config/db');

/*──────────────────────────────────────────────────────────────
  INDIVIDUAL CONSULTANT
──────────────────────────────────────────────────────────────*/

const getLearningPathProgress = async (userId) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM get_consultant_lp_progress(:userId)`,
        { replacements: { userId } }
    );
    return rows;
};

const getPointsHistory = async (userId, { page = 1, limit = 20 } = {}) => {
    const offset = (page - 1) * limit;

    const [sumRows] = await sequelize.query(
        `SELECT COALESCE(SUM(points_delta), 0)::integer AS total_points
         FROM points_history WHERE user_id = :userId`,
        { replacements: { userId } }
    );
    const totalPoints = parseInt(sumRows[0]?.total_points ?? 0, 10);

    const { count, rows } = await models.points_history.findAndCountAll({
        where: { user_id: userId },
        include: [
            { model: models.badges, as: 'badge', attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url'], required: false },
            { model: models.badge_requirements, as: 'requirement', attributes: ['requirement_id', 'requirement_title'], required: false }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
    });

    return {
        totalPoints,
        history: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit
        }
    };
};

const getAcquisitionTimeline = async (userId) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM get_consultant_acquisition_timeline(:userId)`,
        { replacements: { userId } }
    );
    return rows;
};

/*──────────────────────────────────────────────────────────────
  LEADERSHIP / TALENT MANAGEMENT
──────────────────────────────────────────────────────────────*/

const getPeerComparison = async (targetUserId, tolerance = 0.25) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM get_consultant_peer_comparison(:targetUserId, :tolerance)`,
        { replacements: { targetUserId, tolerance } }
    );

    const target = rows.find(r => r.is_target) || null;
    const peers = rows.filter(r => !r.is_target);

    return {
        target,
        peers,
        peerCount: peers.length
    };
};

const getTeamBadgesCount = async ({ serviceLineId = null } = {}) => {
    const [rows] = await sequelize.query(
        `SELECT COUNT(ab.awarded_badges_id)::int AS total_badges,
                COUNT(DISTINCT ab.user_id)::int   AS distinct_consultants
         FROM awarded_badges ab
         JOIN badge_applications ba ON ba.application_id = ab.application_id
         JOIN badges b ON b.badge_id = ba.badge_id
         WHERE (:serviceLineId IS NULL OR b.service_line_id = :serviceLineId)`,
        { replacements: { serviceLineId } }
    );
    return rows[0];
};

const getApplicationsCountByState = async ({ serviceLineId = null, state }) => {
    const [rows] = await sequelize.query(
        `SELECT COUNT(*)::int AS total
         FROM badge_applications ba
         JOIN badges b ON b.badge_id = ba.badge_id
         WHERE ba.application_state = :state
           AND (:serviceLineId IS NULL OR b.service_line_id = :serviceLineId)`,
        { replacements: { serviceLineId, state } }
    );
    return rows[0]?.total ?? 0;
};

const resolveServiceLineForUser = async (userId, role) => {
    if (role !== 'Service Line Leader') return null;
    const sll = await models.service_line_leaders.findByPk(userId, { attributes: ['service_line_id'] });
    return sll?.service_line_id ?? null;
};

/*──────────────────────────────────────────────────────────────
  GENERAL REPORTING
──────────────────────────────────────────────────────────────*/

const getBadgeDistributionMonthly = async ({ groupBy, dateFrom = null, dateTo = null }) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM get_badge_distribution_monthly(:groupBy, :dateFrom, :dateTo)`,
        { replacements: { groupBy, dateFrom, dateTo } }
    );
    return rows;
};

const getBadgesByRange = async ({ dateFrom, dateTo, learningPathId = null, serviceLineId = null, areaId = null, stageId = null }) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM get_badges_by_range(:dateFrom, :dateTo, :learningPathId, :serviceLineId, :areaId, :stageId)`,
        { replacements: { dateFrom, dateTo, learningPathId, serviceLineId, areaId, stageId } }
    );
    return rows;
};

const getBadgesAwardedByLearningPath = async () => {
    const [rows] = await sequelize.query(
        `SELECT lp.learning_path_id,
                lp.path_title,
                lp.path_slug,
                COUNT(ab.awarded_badges_id)::int AS awarded_count
         FROM learning_paths lp
         LEFT JOIN badges b              ON b.learning_path_id = lp.learning_path_id
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id
         WHERE lp.is_active = TRUE
         GROUP BY lp.learning_path_id, lp.path_title, lp.path_slug
         ORDER BY awarded_count DESC, lp.path_title`
    );
    return rows;
};

const getBadgesAwardedByServiceLine = async () => {
    const [rows] = await sequelize.query(
        `SELECT sl.service_line_id,
                sl.service_line_name,
                sl.sl_slug,
                COUNT(ab.awarded_badges_id)::int AS awarded_count
         FROM service_lines sl
         LEFT JOIN badges b              ON b.service_line_id = sl.service_line_id
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id
         WHERE sl.is_active = TRUE
         GROUP BY sl.service_line_id, sl.service_line_name, sl.sl_slug
         ORDER BY awarded_count DESC, sl.service_line_name`
    );
    return rows;
};

const getLevelDistribution = async () => {
    const [rows] = await sequelize.query(
        `SELECT sc.stage_code_id,
                sc.stage_code,
                COUNT(ab.awarded_badges_id)::int AS awarded_count,
                COUNT(DISTINCT ab.user_id)::int  AS distinct_consultants
         FROM stage_codes sc
         LEFT JOIN progression_stages ps ON ps.stage_code_id = sc.stage_code_id
         LEFT JOIN badges b              ON b.progression_stage_id = ps.progression_stage_id
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id
         GROUP BY sc.stage_code_id, sc.stage_code
         ORDER BY sc.stage_code`
    );
    return rows;
};

const getUserEnrollment = async () => {
    const [rows] = await sequelize.query(
        `SELECT
            COUNT(*)::int                                                                  AS total_users,
            COUNT(*) FILTER (WHERE is_active = TRUE)::int                                  AS active_users,
            COUNT(*) FILTER (WHERE is_active = FALSE)::int                                 AS inactive_users,
            COUNT(*) FILTER (WHERE email_confirmed = TRUE)::int                            AS confirmed_users,
            COUNT(*) FILTER (WHERE user_role = 'Consultant'        AND is_active = TRUE)::int AS consultants,
            COUNT(*) FILTER (WHERE user_role = 'Service Line Leader' AND is_active = TRUE)::int AS service_line_leaders,
            COUNT(*) FILTER (WHERE user_role = 'Talent Manager'    AND is_active = TRUE)::int AS talent_managers,
            COUNT(*) FILTER (WHERE user_role = 'Administrator'     AND is_active = TRUE)::int AS administrators
         FROM users`
    );
    return rows[0];
};

const getBadgesPerArea = async (userId) => {
    const [rows] = await sequelize.query(
        `SELECT * FROM fn_consultant_badges_per_area(:userId)`,
        { replacements: { userId } }
    );
    return rows;
};

const reconcileBadgePoints = async () => {
    await sequelize.query(`CALL sp_reconcile_badge_points()`);
};

module.exports = {
    getLearningPathProgress,
    getPointsHistory,
    getAcquisitionTimeline,
    getPeerComparison,
    getTeamBadgesCount,
    getApplicationsCountByState,
    resolveServiceLineForUser,
    getBadgeDistributionMonthly,
    getBadgesByRange,
    getBadgesAwardedByLearningPath,
    getBadgesAwardedByServiceLine,
    getLevelDistribution,
    getUserEnrollment,
    getBadgesPerArea,
    reconcileBadgePoints
};
