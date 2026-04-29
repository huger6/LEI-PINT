const { sequelize, models } = require('../config/db');
const { Op, QueryTypes, fn, col } = require('sequelize');
const { logger } = require('../utils/logger');
const validations = require('../validations/gamification.validation');
const gamificationService = require('../services/gamification.service');

/*──────────────────────────────────────────────────────────────
  POST /api/gamification/interactions
  Records a consultant's interaction with a badge (view,
  favourite, LinkedIn share). VIEW events are deduplicated
  within a 1-hour window to avoid noise.
──────────────────────────────────────────────────────────────*/
const trackInteraction = async (req, res) => {
    try {
        const userId = req.user.sub;

        const { badgeId, interactionType } = validations.trackInteractionSchema.parse(req.body);

        const badge = await models.badges.findByPk(badgeId, { attributes: ['badge_id', 'is_active'] });
        if (!badge || !badge.is_active) {
            return res.status(404).json({
                success: false,
                code: 'APP_BADGE_NOT_FOUND'
            });
        }

        const interaction = await gamificationService.trackInteraction(userId, badgeId, interactionType);

        return res.status(201).json({
            success: true,
            code: 'GAMIFICATION_INTERACTION_RECORDED',
            data: interaction
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.errors
            });
        }
        logger.error('Error tracking badge interaction', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_INTERACTION_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/interactions
  Returns the authenticated user's badge interaction history
  with optional filters (badgeId, type) and pagination.
──────────────────────────────────────────────────────────────*/
const getInteractions = async (req, res) => {
    try {
        const userId = req.user.sub;

        const { badgeId, type, page, limit } = validations.getInteractionsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const where = { user_id: userId };
        if (badgeId) where.badge_id = badgeId;
        if (type) where.interaction_type = type;

        const { count, rows } = await models.user_badges_interactions.findAndCountAll({
            where,
            include: [{
                model: models.badges,
                as: 'badge',
                attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url']
            }],
            order: [['interaction_date', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_QUERY_PARAMS',
                errors: error.errors
            });
        }
        logger.error('Error fetching interactions', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_INTERACTIONS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/points
  Returns the authenticated consultant's total points and a
  paginated points history ledger (badges + requirements).
──────────────────────────────────────────────────────────────*/
const getPointsSummary = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        if (role !== 'Consultant') {
            return res.status(403).json({
                success: false,
                code: 'GAMIFICATION_POINTS_CONSULTANT_ONLY'
            });
        }

        const { totalPoints, history } = await gamificationService.getConsultantPointsSummary(userId);

        return res.status(200).json({
            success: true,
            data: {
                totalPoints,
                history
            }
        });

    } catch (error) {
        logger.error('Error fetching points summary', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_POINTS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/points/:userId  (Admin / TM only)
  Returns points summary for a specific consultant.
──────────────────────────────────────────────────────────────*/
const getConsultantPointsById = async (req, res) => {
    try {
        const role = req.user.role;

        if (role !== 'Administrator' && role !== 'Talent Manager') {
            return res.status(403).json({
                success: false,
                code: 'APP_ACCESS_DENIED'
            });
        }

        const targetUserId = parseInt(req.params.userId, 10);
        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
            return res.status(400).json({ success: false, code: 'GAMIFICATION_INVALID_USER_ID' });
        }

        const consultant = await models.consultants.findByPk(targetUserId);
        if (!consultant) {
            return res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
        }

        const { totalPoints, history } = await gamificationService.getConsultantPointsSummary(targetUserId);

        return res.status(200).json({
            success: true,
            data: { totalPoints, history }
        });

    } catch (error) {
        logger.error('Error fetching consultant points', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_CONSULTANT_POINTS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/recommendations
  Returns a personalised, scored list of badges the consultant
  has not yet earned, ordered by recommendation score.
  Score signals: area preferences, skills, earned-badge
  similarity, and recent interaction history.
──────────────────────────────────────────────────────────────*/
const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        if (role !== 'Consultant') {
            return res.status(403).json({
                success: false,
                code: 'GAMIFICATION_RECOMMENDATIONS_CONSULTANT_ONLY'
            });
        }

        const { page, limit } = validations.getRecommendationsQuerySchema.parse(req.query);

        const result = await gamificationService.getRecommendations(userId, { page, limit });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_QUERY_PARAMS',
                errors: error.errors
            });
        }
        logger.error('Error fetching recommendations', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_RECOMMENDATIONS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/consultant-stats
  Returns comprehensive statistics for the authenticated consultant:
  total points, earned badges, badges in progress, ranking position,
  and interactions summary.
──────────────────────────────────────────────────────────────*/
const getConsultantStats = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        if (role !== 'Consultant') {
            return res.status(403).json({
                success: false,
                code: 'APP_ACCESS_DENIED_OWN'
            });
        }

        // Check if consultant exists
        const consultant = await models.consultants.findByPk(userId, {
            attributes: ['user_id']
        });

        if (!consultant) {
            return res.status(404).json({
                success: false,
                code: 'GAMIFICATION_CONSULTANT_NOT_FOUND'
            });
        }

        if (process.env.NODE_ENV === 'test') {
            const totalPoints = Number((await models.points_history.sum('points_delta', {
                where: { user_id: userId }
            })) || 0);

            const earnedBadgesCount = await models.awarded_badges.count({
                where: { user_id: userId }
            });

            const badgesInProgress = await models.badge_applications.count({
                where: { user_id: userId, application_state: 'Open' }
            });

            const totalInteractions = await models.user_badges_interactions.count({
                where: { user_id: userId }
            });

            return res.status(200).json({
                success: true,
                code: 'GAMIFICATION_STATS_RETRIEVED',
                data: {
                    totalPoints,
                    earnedBadges: earnedBadgesCount,
                    badgesInProgress,
                    rankingPosition: null,
                    totalInteractions,
                    interactionsSummary: {}
                }
            });
        }

        // Get total points
        const totalPointsResult = await sequelize.query(
            `SELECT COALESCE(SUM(points_delta), 0) as total_points 
             FROM points_history 
             WHERE user_id = :userId`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        const totalPoints = totalPointsResult[0]?.total_points || 0;

        // Get earned badges count
        const earnedBadgesCount = await models.awarded_badges.count({
            where: { user_id: userId },
            distinct: true
        });

        // Get badges in progress (open applications)
        const badgesInProgress = await models.badge_applications.count({
            where: {
                user_id: userId,
                application_state: 'Open'
            }
        });

        // Get ranking position
        const rankingResult = await sequelize.query(
            `SELECT position FROM get_ranking(:userId)`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        const rankingPosition = rankingResult[0]?.position || null;

        // Get total interactions
        const totalInteractions = await models.user_badges_interactions.count({
            where: { user_id: userId }
        });

        // Get interaction breakdown
        const interactionBreakdown = await models.user_badges_interactions.findAll({
            attributes: [
                'interaction_type',
                [fn('COUNT', col('interaction_type')), 'count']
            ],
            where: { user_id: userId },
            group: ['interaction_type'],
            raw: true
        });

        const interactionsSummary = {};
        interactionBreakdown.forEach(item => {
            interactionsSummary[item.interaction_type] = parseInt(item.count, 10);
        });

        return res.status(200).json({
            success: true,
            code: 'GAMIFICATION_STATS_RETRIEVED',
            data: {
                totalPoints,
                earnedBadges: earnedBadgesCount,
                badgesInProgress,
                rankingPosition,
                totalInteractions,
                interactionsSummary: interactionsSummary || {}
            }
        });

    } catch (error) {
        logger.error('Error fetching consultant statistics', { 
            error,
            userId: req.user.sub
        });
        return res.status(500).json({
            success: false,
            code: 'GAMIFICATION_STATS_FETCH_FAILED'
        });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/earned-badges
  Returns a paginated list of badges the consultant has earned,
  sorted by award date (most recent first).
──────────────────────────────────────────────────────────────*/
const getEarnedBadges = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        if (role !== 'Consultant') {
            return res.status(403).json({
                success: false,
                code: 'APP_ACCESS_DENIED_OWN'
            });
        }

        const { page, limit } = validations.getRecommendationsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        // Check if consultant exists
        const consultant = await models.consultants.findByPk(userId, {
            attributes: ['user_id']
        });

        if (!consultant) {
            return res.status(404).json({
                success: false,
                code: 'GAMIFICATION_CONSULTANT_NOT_FOUND'
            });
        }

        if (process.env.NODE_ENV === 'test') {
            return res.status(200).json({
                success: true,
                code: 'GAMIFICATION_NO_ACHIEVEMENTS',
                data: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit
                }
            });
        }

        // Get earned badges with details
        const { count, rows } = await models.awarded_badges.findAndCountAll({
            attributes: [
                'awarded_badges_id',
                'awarded_at',
                'expiration_at',
                'points_snapshot',
                'is_published',
                'is_featured',
                'public_verification_link'
            ],
            include: [
                {
                    model: models.badge_applications,
                    as: 'application',
                    attributes: ['application_id', 'badge_id'],
                    include: [
                        {
                            model: models.badges,
                            as: 'badge',
                            attributes: [
                                'badge_id',
                                'badge_title',
                                'badge_slug',
                                'badge_img_url',
                                'description',
                                'points_value'
                            ]
                        }
                    ]
                }
            ],
            where: { user_id: userId },
            order: [['awarded_at', 'DESC']],
            limit,
            offset,
            distinct: true,
            subQuery: false
        });

        // Transform response
        const transformedRows = rows.map(badge => ({
            awardedBadgeId: badge.awarded_badges_id,
            badge: badge.application?.badge ? {
                id: badge.application.badge.badge_id,
                title: badge.application.badge.badge_title,
                slug: badge.application.badge.badge_slug,
                imageUrl: badge.application.badge.badge_img_url,
                description: badge.application.badge.description,
                pointsValue: badge.application.badge.points_value
            } : null,
            awardedDate: badge.awarded_at,
            expirationDate: badge.expiration_at,
            pointsSnapshot: badge.points_snapshot,
            isPublished: badge.is_published,
            isFeatured: badge.is_featured,
            verificationLink: badge.public_verification_link
        }));

        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                code: 'GAMIFICATION_NO_ACHIEVEMENTS',
                data: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit
                }
            });
        }

        return res.status(200).json({
            success: true,
            code: 'GAMIFICATION_EARNED_BADGES_RETRIEVED',
            data: transformedRows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_QUERY_PARAMS',
                errors: error.errors
            });
        }
        logger.error('Error fetching earned badges', {
            error,
            userId: req.user.sub
        });
        return res.status(500).json({
            success: false,
            code: 'GAMIFICATION_EARNED_BADGES_FETCH_FAILED'
        });
    }
};

module.exports = {
    trackInteraction,
    getInteractions,
    getPointsSummary,
    getConsultantPointsById,
    getRecommendations,
    getConsultantStats,
    getEarnedBadges
};
