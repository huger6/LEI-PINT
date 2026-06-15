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

// Badges (and points) acquired per month, with a running cumulative total.
const getAcquisitionTimeline = async (userId) => {
    const [rows] = await sequelize.query(
        `SELECT
            to_char(date_trunc('month', ab.awarded_at), 'YYYY-MM') AS month,
            COUNT(*)::int AS badges,
            COALESCE(SUM(ab.points_snapshot), 0)::int AS points
         FROM awarded_badges ab
         WHERE ab.user_id = :userId AND ab.awarded_at IS NOT NULL
         GROUP BY 1
         ORDER BY 1`,
        { replacements: { userId } }
    );

    let cumulativeBadges = 0;
    let cumulativePoints = 0;
    return rows.map((r) => {
        cumulativeBadges += Number(r.badges);
        cumulativePoints += Number(r.points);
        return {
            month: r.month,
            badges: Number(r.badges),
            points: Number(r.points),
            cumulativeBadges,
            cumulativePoints,
        };
    });
};

/*──────────────────────────────────────────────────────────────
  LEADERSHIP / TALENT MANAGEMENT
──────────────────────────────────────────────────────────────*/

// Compares a consultant against peers who share at least one area AND have
// similar tenure (account age within `tolerance` of the target's), reporting
// each one's points/badges plus peer averages.
const getPeerComparison = async (targetUserId, tolerance = 0.25) => {
    const [rows] = await sequelize.query(
        `WITH target_areas AS (
            SELECT area_id FROM consultant_areas WHERE user_id = :targetUserId
        ),
        target_tenure AS (
            SELECT GREATEST(EXTRACT(EPOCH FROM (NOW() - created_at)), 1) AS secs
            FROM users WHERE user_id = :targetUserId
        )
        SELECT
            u.user_guid,
            u.full_name,
            u.profile_img_url,
            (u.user_id = :targetUserId) AS is_target,
            COALESCE((SELECT SUM(ph.points_delta) FROM points_history ph WHERE ph.user_id = u.user_id), 0)::int AS total_points,
            (SELECT COUNT(*) FROM awarded_badges ab WHERE ab.user_id = u.user_id)::int AS total_badges,
            (SELECT a.area_name FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id
                WHERE ca.user_id = u.user_id AND ca.is_primary = TRUE LIMIT 1) AS primary_area_name
        FROM users u
        INNER JOIN consultants c ON c.user_id = u.user_id
        WHERE u.user_role = 'Consultant' AND u.is_active = TRUE
          AND (
            u.user_id = :targetUserId
            OR (
              EXISTS (SELECT 1 FROM consultant_areas ca WHERE ca.user_id = u.user_id AND ca.area_id IN (SELECT area_id FROM target_areas))
              AND ABS(EXTRACT(EPOCH FROM (NOW() - u.created_at)) - (SELECT secs FROM target_tenure))
                  <= (SELECT secs FROM target_tenure) * :tolerance
            )
          )
        ORDER BY total_points DESC, full_name ASC`,
        { replacements: { targetUserId, tolerance } }
    );

    const target = rows.find((r) => r.is_target) || null;
    const peers = rows.filter((r) => !r.is_target);
    const avg = (arr, key) => (arr.length ? Math.round(arr.reduce((s, r) => s + Number(r[key]), 0) / arr.length) : 0);

    return {
        target,
        peers,
        peerCount: peers.length,
        averages: {
            points: avg(peers, 'total_points'),
            badges: avg(peers, 'total_badges'),
        },
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

// True when the consultant has at least one area inside the given service line.
// Used to keep a Service Line Leader from inspecting consultants outside their SL.
const isConsultantInServiceLine = async (userId, serviceLineId) => {
    if (!serviceLineId) return false;
    const [rows] = await sequelize.query(
        `SELECT 1
           FROM consultant_areas ca
           JOIN areas a ON a.area_id = ca.area_id
          WHERE ca.user_id = :userId AND a.service_line_id = :serviceLineId
          LIMIT 1`,
        { replacements: { userId, serviceLineId } }
    );
    return rows.length > 0;
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

const getBadgesAwardedByLearningPath = async (filters = {}) => {
    const repl = {};
    const bf = badgeJoinFilter(filters, repl);
    const af = awardedJoinFilter(filters, repl);
    const [rows] = await sequelize.query(
        `SELECT lp.learning_path_id,
                lp.path_title,
                lp.path_slug,
                COUNT(ab.awarded_badges_id)::int AS awarded_count
         FROM learning_paths lp
         LEFT JOIN badges b              ON b.learning_path_id = lp.learning_path_id${bf}
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id${af}
         WHERE lp.is_active = TRUE
         GROUP BY lp.learning_path_id, lp.path_title, lp.path_slug
         ORDER BY awarded_count DESC, lp.path_title`,
        { replacements: repl }
    );
    return rows;
};

// Optional filters injected into the LEFT JOINs so the grouping dimension keeps
// all its rows while only matching badges/awards are counted.
const badgeJoinFilter = (f = {}, repl = {}) => {
    let sql = '';
    if (f.areaId) { sql += ' AND b.area_id = :areaId'; repl.areaId = f.areaId; }
    if (f.serviceLineId) { sql += ' AND b.service_line_id = :serviceLineId'; repl.serviceLineId = f.serviceLineId; }
    return sql;
};
const awardedJoinFilter = (f = {}, repl = {}) => {
    let sql = '';
    if (f.dateFrom) { sql += ' AND ab.awarded_at >= :dateFrom'; repl.dateFrom = f.dateFrom; }
    if (f.dateTo) { sql += ' AND ab.awarded_at <= :dateTo'; repl.dateTo = f.dateTo; }
    return sql;
};

const getBadgesAwardedByServiceLine = async (filters = {}) => {
    const repl = {};
    const bf = badgeJoinFilter(filters, repl);
    const af = awardedJoinFilter(filters, repl);
    const [rows] = await sequelize.query(
        `SELECT sl.service_line_id,
                sl.service_line_name,
                sl.sl_slug,
                COUNT(ab.awarded_badges_id)::int AS awarded_count
         FROM service_lines sl
         LEFT JOIN badges b              ON b.service_line_id = sl.service_line_id${bf}
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id${af}
         WHERE sl.is_active = TRUE
         GROUP BY sl.service_line_id, sl.service_line_name, sl.sl_slug
         ORDER BY awarded_count DESC, sl.service_line_name`,
        { replacements: repl }
    );
    return rows;
};

const getLevelDistribution = async (filters = {}) => {
    const repl = {};
    const bf = badgeJoinFilter(filters, repl);
    const af = awardedJoinFilter(filters, repl);
    const [rows] = await sequelize.query(
        `SELECT sc.stage_code_id,
                sc.stage_code,
                COUNT(ab.awarded_badges_id)::int AS awarded_count,
                COUNT(DISTINCT ab.user_id)::int  AS distinct_consultants
         FROM stage_codes sc
         LEFT JOIN progression_stages ps ON ps.stage_code_id = sc.stage_code_id
         LEFT JOIN badges b              ON b.progression_stage_id = ps.progression_stage_id${bf}
         LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id
         LEFT JOIN awarded_badges ab     ON ab.application_id = ba.application_id${af}
         GROUP BY sc.stage_code_id, sc.stage_code
         ORDER BY sc.stage_code`,
        { replacements: repl }
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
    isConsultantInServiceLine,
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
