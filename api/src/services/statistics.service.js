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

const getPointsHistory = async (userId, { page = 1, limit = 20, search, serviceLineId, areaId, dateFrom, dateTo } = {}) => {
    const { Op } = require('sequelize');
    const offset = (page - 1) * limit;

    const [sumRows] = await sequelize.query(
        `SELECT COALESCE(SUM(points_delta), 0)::integer AS total_points
         FROM points_history WHERE user_id = :userId`,
        { replacements: { userId } }
    );
    const totalPoints = parseInt(sumRows[0]?.total_points ?? 0, 10);

    const needsBadgeFilter = !!(search || serviceLineId || areaId);

    const badgeInclude = {
        model: models.badges,
        as: 'badge',
        attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url'],
        required: needsBadgeFilter,
        include: [
            { model: models.service_lines, as: 'service_line', attributes: ['service_line_id', 'service_line_name'], required: !!serviceLineId },
            { model: models.areas, as: 'area', attributes: ['area_id', 'area_name'], required: !!areaId }
        ]
    };

    const badgeWhere = [];
    if (search) {
        const pattern = `%${search}%`;
        badgeWhere.push({
            [Op.or]: [
                { badge_title: { [Op.iLike]: pattern } },
                { '$badge.service_line.service_line_name$': { [Op.iLike]: pattern } },
                { '$badge.area.area_name$': { [Op.iLike]: pattern } }
            ]
        });
    }
    if (serviceLineId) {
        badgeWhere.push({ '$badge.service_line.service_line_id$': serviceLineId });
    }
    if (areaId) {
        badgeWhere.push({ '$badge.area.area_id$': areaId });
    }
    if (badgeWhere.length) {
        badgeInclude.where = badgeWhere.length === 1 ? badgeWhere[0] : { [Op.and]: badgeWhere };
    }

    const historyWhere = { user_id: userId };
    if (dateFrom || dateTo) {
        historyWhere.created_at = {};
        if (dateFrom) historyWhere.created_at[Op.gte] = dateFrom;
        if (dateTo) historyWhere.created_at[Op.lte] = dateTo;
    }

    const { count, rows } = await models.points_history.findAndCountAll({
        where: historyWhere,
        include: [
            badgeInclude,
            { model: models.badge_requirements, as: 'requirement', attributes: ['requirement_id', 'requirement_title'], required: false }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        subQuery: false
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

const getExpiringBadges = async ({ withinDays = 30 } = {}) => {
    const [rows] = await sequelize.query(
        `SELECT u.user_guid,
                u.full_name,
                b.badge_title,
                b.badge_slug,
                ab.awarded_at,
                ab.expiration_at,
                (ab.expiration_at::date - CURRENT_DATE)::int AS days_remaining
         FROM awarded_badges ab
         JOIN badge_applications ba ON ba.application_id = ab.application_id
         JOIN badges b             ON b.badge_id = ba.badge_id
         JOIN users u              ON u.user_id = ab.user_id
         WHERE ab.expiration_at IS NOT NULL
           AND ab.expiration_at >= NOW()
           AND ab.expiration_at <= NOW() + make_interval(days => :withinDays)
         ORDER BY ab.expiration_at ASC`,
        { replacements: { withinDays } }
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
    getExpiringBadges,
    reconcileBadgePoints
};
