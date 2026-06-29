const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');

/*──────────────────────────────────────────────────────────────
  POINTS – BADGE COMPLETION
  Called when a badge application transitions to 'Accepted'.
  Idempotent: badge completion points awarded once per badge.
──────────────────────────────────────────────────────────────*/
const awardBadgeCompletionPoints = async (userId, badgeId, transaction = null) => {
    const badge = await models.badges.findByPk(badgeId);

    if (!badge || badge.badge_points <= 0) return null;

    const existing = await models.points_history.findOne({
        where: { user_id: userId, badge_id: badgeId, requirement_id: null }
    });

    if (existing) return null;

    const record = await models.points_history.create({
        user_id: userId,
        badge_id: badgeId,
        requirement_id: null,
        points_delta: badge.badge_points,
        justification: `Badge completed: ${badge.badge_title}`
    }, { transaction });

    logger.info('Badge completion points awarded', {
        userId,
        badgeId,
        points: badge.badge_points
    });

    return record;
};

/*──────────────────────────────────────────────────────────────
  POINTS – CONSULTANT SUMMARY
  Returns total points and full ledger for a consultant.
──────────────────────────────────────────────────────────────*/
const getConsultantPointsSummary = async (userId) => {
    const [sumRows] = await sequelize.query(
        `SELECT COALESCE(SUM(points_delta), 0)::integer AS total_points
         FROM points_history
         WHERE user_id = :userId`,
        { replacements: { userId } }
    );

    const totalPoints = parseInt(sumRows[0]?.total_points ?? 0, 10);

    const history = await models.points_history.findAll({
        where: { user_id: userId },
        include: [
            {
                model: models.badges,
                as: 'badge',
                attributes: ['badge_title', 'badge_slug', 'badge_img_url'],
                required: false
            },
            {
                model: models.badge_requirements,
                as: 'requirement',
                attributes: ['requirement_title'],
                required: false
            }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
    });

    return { totalPoints, history };
};

/*──────────────────────────────────────────────────────────────
  POINTS + GLOBAL RANK FOR A SINGLE CONSULTANT
  Lightweight lookup (no history rows) used to enrich views that
  already gate access to the consultant, e.g. application detail.
  total_points is the consultant's REAL balance (net of rewards
  spent / lost); the ranking position is computed on EARNED points
  only, matching the global leaderboard (getMyPosition no filters).
──────────────────────────────────────────────────────────────*/
const getConsultantPointsAndRank = async (userId) => {
    const rows = await sequelize.query(
        `WITH computed AS (
            SELECT
                u.user_id,
                -- Real balance shown in the application detail (net of rewards spent).
                COALESCE((
                    SELECT SUM(ph.points_delta) FROM points_history ph WHERE ph.user_id = u.user_id
                ), 0) AS total_points,
                -- Earned-only total (positive deltas) drives the ranking position so
                -- spending points in the rewards store never changes the rank.
                COALESCE((
                    SELECT SUM(ph.points_delta) FROM points_history ph
                    WHERE ph.user_id = u.user_id AND ph.points_delta > 0
                ), 0) AS earned_points,
                (
                    SELECT COUNT(ab.awarded_badges_id) FROM awarded_badges ab WHERE ab.user_id = u.user_id
                ) AS total_badges,
                u.full_name
            FROM users u
            WHERE u.user_role = 'Consultant' AND u.is_active = TRUE
        ),
        ranked AS (
            SELECT
                user_id,
                total_points,
                ROW_NUMBER() OVER (
                    ORDER BY earned_points DESC, total_badges DESC, full_name ASC
                ) AS position
            FROM computed
        )
        SELECT total_points, position FROM ranked WHERE user_id = :userId`,
        { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    );

    if (!rows.length) return { totalPoints: 0, rankingPosition: null };

    return {
        totalPoints: parseInt(rows[0].total_points ?? 0, 10),
        rankingPosition: rows[0].position != null ? Number(rows[0].position) : null
    };
};

/*──────────────────────────────────────────────────────────────
  RECOMMENDATIONS
  Delegates to the get_badge_recommendations stored procedure.
──────────────────────────────────────────────────────────────*/
const getRecommendations = async (userId, { page = 1, limit = 12 } = {}) => {
    const offset = (page - 1) * limit;

    const [rows] = await sequelize.query(
        `SELECT * FROM get_badge_recommendations(:userId, :limit, :offset)`,
        { replacements: { userId, limit, offset } }
    );

    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 0;

    return {
        data: rows.map(({ total_count, ...badge }) => badge),
        pagination: {
            totalItems: totalCount,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

/*──────────────────────────────────────────────────────────────
  INTERACTIONS
  Records a user interaction with a badge.
  VIEW interactions are deduplicated within a 1-hour window
  to avoid noise from repeated page visits.
──────────────────────────────────────────────────────────────*/
const trackInteraction = async (userId, badgeId, interactionType) => {
    if (interactionType === 'VIEW') {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const { Op } = require('sequelize');
        const recent = await models.user_badges_interactions.findOne({
            where: {
                user_id: userId,
                badge_id: badgeId,
                interaction_type: 'VIEW',
                interaction_date: { [Op.gte]: oneHourAgo }
            }
        });
        if (recent) return recent;
    }

    const interaction = await models.user_badges_interactions.create({
        user_id: userId,
        badge_id: badgeId,
        interaction_type: interactionType
    });

    return interaction;
};

/*──────────────────────────────────────────────────────────────
  FAVORITES – TOGGLE
  Adds or removes a FAVORITE interaction for a user+badge pair.
  Returns { favorited: true/false } to indicate the new state.
──────────────────────────────────────────────────────────────*/
const toggleFavorite = async (userId, badgeId) => {
    const existing = await models.user_badges_interactions.findOne({
        where: {
            user_id: userId,
            badge_id: badgeId,
            interaction_type: 'FAVORITE'
        }
    });

    if (existing) {
        await models.user_badges_interactions.destroy({
            where: {
                user_id: userId,
                badge_id: badgeId,
                interaction_type: 'FAVORITE'
            }
        });
        return { favorited: false };
    }

    await models.user_badges_interactions.create({
        user_id: userId,
        badge_id: badgeId,
        interaction_type: 'FAVORITE'
    });

    return { favorited: true };
};

/*──────────────────────────────────────────────────────────────
  FAVORITES – LIST
  Returns all badge IDs currently favorited by the user.
──────────────────────────────────────────────────────────────*/
const getUserFavorites = async (userId) => {
    const rows = await models.user_badges_interactions.findAll({
        attributes: ['badge_id'],
        where: {
            user_id: userId,
            interaction_type: 'FAVORITE'
        },
        include: [{
            model: models.badges,
            as: 'badge',
            attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url'],
            where: { is_active: true },
            required: true
        }]
    });

    return rows;
};

/*──────────────────────────────────────────────────────────────
  CONSULTANT STATS DASHBOARD
  Aggregates all dashboard metrics for a consultant in one place:
  total points, earned badges, in-progress badges, ranking
  position, and interaction breakdown.
──────────────────────────────────────────────────────────────*/
const getConsultantStats = async (userId) => {
    const [sumRows] = await sequelize.query(
        `SELECT COALESCE(SUM(points_delta), 0)::integer AS total_points
         FROM points_history WHERE user_id = :userId`,
        { replacements: { userId } }
    );
    const totalPoints = parseInt(sumRows[0]?.total_points ?? 0, 10);

    const earnedBadges = await models.awarded_badges.count({
        where: { user_id: userId },
        distinct: true
    });

    const badgesInProgress = await models.badge_applications.count({
        where: { user_id: userId, application_state: 'Open' }
    });

    const [rankRows] = await sequelize.query(
        `SELECT position FROM get_ranking(:userId)`,
        { replacements: { userId } }
    );
    const rankingPosition = rankRows[0]?.position ?? null;

    const totalInteractions = await models.user_badges_interactions.count({ where: { user_id: userId } });

    const interactionBreakdown = await models.user_badges_interactions.findAll({
        attributes: [
            'interaction_type',
            [sequelize.fn('COUNT', sequelize.col('interaction_type')), 'count']
        ],
        where: { user_id: userId },
        group: ['interaction_type'],
        raw: true
    });

    const interactionsSummary = {};
    interactionBreakdown.forEach(({ interaction_type, count }) => {
        interactionsSummary[interaction_type] = parseInt(count, 10);
    });

    return { totalPoints, earnedBadges, badgesInProgress, rankingPosition, totalInteractions, interactionsSummary };
};

module.exports = {
    awardBadgeCompletionPoints,
    getConsultantPointsSummary,
    getConsultantPointsAndRank,
    getConsultantStats,
    getRecommendations,
    trackInteraction,
    toggleFavorite,
    getUserFavorites
};
