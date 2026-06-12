const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');

/*──────────────────────────────────────────────────────────────
  POINTS – REQUIREMENT COMPLETION
  Called when a reviewer approves an evidence for a requirement.
  Idempotent: awards points at most once per (user, requirement).
──────────────────────────────────────────────────────────────*/
const awardRequirementPoints = async (userId, requirementId, transaction = null) => {
    const requirement = await models.badge_requirements.findByPk(requirementId);

    if (!requirement || !requirement.is_active || requirement.badge_points <= 0) {
        return null;
    }

    // Idempotency check – never award twice for the same requirement
    const existing = await models.points_history.findOne({
        where: { user_id: userId, requirement_id: requirementId }
    });
    if (existing) return existing;

    const record = await models.points_history.create({
        user_id: userId,
        requirement_id: requirementId,
        badge_id: requirement.badge_id,
        points_delta: requirement.badge_points,
        justification: `Requirement completed: ${requirement.requirement_title}`
    }, { transaction });

    logger.info('Requirement points awarded', {
        userId,
        requirementId,
        points: requirement.badge_points
    });

    return record;
};

/*──────────────────────────────────────────────────────────────
  POINTS – BADGE COMPLETION
  Called when a badge application transitions to 'Accepted'.
  Also awards any pending requirement points to guarantee
  every requirement is accounted for.
  Idempotent: badge completion points awarded once per badge.
──────────────────────────────────────────────────────────────*/
const awardBadgeCompletionPoints = async (userId, badgeId, transaction = null) => {
    const badge = await models.badges.findByPk(badgeId, {
        include: [{
            model: models.badge_requirements,
            as: 'badge_requirements',
            where: { is_active: true },
            required: false
        }]
    });

    if (!badge) return null;

    const results = { requirementRecords: [], badgeRecord: null };

    // Award any requirement points not yet credited
    for (const req of badge.badge_requirements) {
        const record = await awardRequirementPoints(userId, req.requirement_id, transaction);
        if (record) results.requirementRecords.push(record);
    }

    // Badge-level completion points (idempotency: no requirement_id on this row)
    if (badge.badge_points > 0) {
        const existingBadge = await models.points_history.findOne({
            where: { user_id: userId, badge_id: badgeId, requirement_id: null }
        });

        if (!existingBadge) {
            results.badgeRecord = await models.points_history.create({
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
        }
    }

    return results;
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
        where: { consultant_id: userId, status: 'Open' }
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
    awardRequirementPoints,
    awardBadgeCompletionPoints,
    getConsultantPointsSummary,
    getConsultantStats,
    getRecommendations,
    trackInteraction
};
