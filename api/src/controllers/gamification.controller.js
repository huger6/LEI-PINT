const { sequelize, models } = require('../config/db');
const { Op, QueryTypes, fn, col } = require('sequelize');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/gamification.validation');
const { uuidRule } = require('../validations/shared-rules');
const gamificationService = require('../services/gamification.service');
const statsService = require('../services/statistics.service');
const { sendTopicUpdate } = require('../services/firebase.service');

// On-screen celebration animations fire when a consultant reaches these badge
// counts (kept in sync with the consultant Achievements page milestones).
const BADGE_MILESTONES = [1, 3, 5, 10, 25];

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

        await sendTopicUpdate("new_data", 19);

        return res.status(201).json({
            success: true,
            code: 'GAMIFICATION_INTERACTION_RECORDED',
            data: interaction
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
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
        if (error.name === 'ZodError') return handleZodError(res, error);
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

        const userGuid = req.params.userGuid;
        try {
            uuidRule.parse(userGuid);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'GAMIFICATION_INVALID_USER_ID');
            throw error;
        }

        const user = await models.users.findOne({ where: { user_guid: userGuid }, attributes: ['user_id'] });
        if (!user) {
            return res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
        }

        const consultant = await models.consultants.findByPk(user.user_id);
        if (!consultant) {
            return res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
        }

        const { totalPoints, history } = await gamificationService.getConsultantPointsSummary(user.user_id);

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
        if (error.name === 'ZodError') return handleZodError(res, error);
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
            return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED_OWN' });
        }

        const consultant = await models.consultants.findByPk(userId, { attributes: ['user_id'] });
        if (!consultant) {
            return res.status(404).json({ success: false, code: 'GAMIFICATION_CONSULTANT_NOT_FOUND' });
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

        // Get ranking position using cross-db SQL (Postgres/SQLite)
        const rankingResult = await sequelize.query(
            `SELECT ranked.position
             FROM (
                SELECT
                    c.user_id,
                    ROW_NUMBER() OVER (
                        ORDER BY COALESCE(SUM(ph.points_delta), 0) DESC, c.user_id ASC
                    ) AS position
                FROM consultants c
                LEFT JOIN points_history ph ON ph.user_id = c.user_id
                GROUP BY c.user_id
             ) ranked
             WHERE ranked.user_id = :userId`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        const rankingPosition = rankingResult[0]?.position ?? null;

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
        logger.error('Error fetching consultant statistics', { error, userId: req.user.sub });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_STATS_FETCH_FAILED' });
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

        const { page, limit } = validations.getPointsHistoryQuerySchema.parse(req.query);
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

        const totalEarnedBadges = await models.awarded_badges.count({
            where: { user_id: userId }
        });

        if (totalEarnedBadges === 0) {
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
                    attributes: ['application_id', 'application_guid', 'badge_id'],
                    include: [
                        {
                            model: models.badges,
                            as: 'badge',
                            attributes: [
                                'badge_id',
                                'badge_title',
                                'badge_slug',
                                'badge_img_url',
                                'badge_description',
                                'badge_points'
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
            applicationId: badge.application?.application_id ?? null,
            applicationGuid: badge.application?.application_guid ?? null,
            badge: badge.application?.badge ? {
                id: badge.application.badge.badge_id,
                title: badge.application.badge.badge_title,
                slug: badge.application.badge.badge_slug,
                imageUrl: badge.application.badge.badge_img_url,
                description: badge.application.badge.badge_description,
                pointsValue: badge.application.badge.badge_points
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
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');
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

/*──────────────────────────────────────────────────────────────
  POST /api/gamification/favorites/:badgeSlug
  Toggles the FAVORITE state for a badge. If already favorited,
  removes it; otherwise creates the favorite interaction.
──────────────────────────────────────────────────────────────*/
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { badgeSlug } = req.params;

        const badge = await models.badges.findOne({
            where: { badge_slug: badgeSlug, is_active: true },
            attributes: ['badge_id']
        });

        if (!badge) {
            return res.status(404).json({
                success: false,
                code: 'APP_BADGE_NOT_FOUND'
            });
        }

        const result = await gamificationService.toggleFavorite(userId, badge.badge_id);

        await sendTopicUpdate("new_data", 19);

        return res.status(200).json({
            success: true,
            code: result.favorited
                ? 'GAMIFICATION_FAVORITE_ADDED'
                : 'GAMIFICATION_FAVORITE_REMOVED',
            data: result
        });

    } catch (error) {
        logger.error('Error toggling badge favorite', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_FAVORITE_TOGGLE_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/favorites
  Returns the list of badges the authenticated user has favorited.
──────────────────────────────────────────────────────────────*/
const getFavorites = async (req, res) => {
    try {
        const userId = req.user.sub;

        const rows = await gamificationService.getUserFavorites(userId);

        return res.status(200).json({
            success: true,
            code: 'GAMIFICATION_FAVORITES_RETRIEVED',
            data: rows
        });

    } catch (error) {
        logger.error('Error fetching favorites', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_FAVORITES_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  PATCH /api/gamification/earned-badges/:verificationLink/featured
  Lets a consultant choose which of their earned badges are shown
  on their public profile (gallery customisation). Identified by the
  public verification link, never the PK.
  Body: { featured: boolean }
──────────────────────────────────────────────────────────────*/
const setBadgeFeatured = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { verificationLink } = req.params;
        const { featured } = req.body || {};

        if (typeof featured !== 'boolean') {
            return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_DATA' });
        }

        const [updated] = await models.awarded_badges.update(
            { is_featured: featured },
            { where: { public_verification_link: verificationLink, user_id: userId } }
        );

        if (updated === 0) {
            return res.status(404).json({ success: false, code: 'GAMIFICATION_BADGE_NOT_FOUND' });
        }

        return res.status(200).json({
            success: true,
            code: 'GAMIFICATION_BADGE_FEATURED_UPDATED',
            data: { featured }
        });
    } catch (error) {
        logger.error('Error updating badge featured flag', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_BADGE_FEATURE_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/gamification/overview
  Read-only snapshot of the gamification system for leadership
  roles (points-per-badge, available rewards, badge milestones).
  For a Service Line Leader the points table is scoped to their
  own Service Line; rewards and milestones are global.
──────────────────────────────────────────────────────────────*/
const getSystemOverview = async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.sub;

        // SLL → scope the points-per-badge table to their own service line.
        const serviceLineId = await statsService.resolveServiceLineForUser(userId, role);

        const badgeWhere = { is_active: true };
        if (serviceLineId) badgeWhere.service_line_id = serviceLineId;

        const badges = await models.badges.findAll({
            where: badgeWhere,
            attributes: ['badge_title', 'badge_slug', 'badge_points', 'badge_type'],
            include: [
                { model: models.service_lines, as: 'service_line', attributes: ['service_line_name'] },
                { model: models.areas, as: 'area', attributes: ['area_name'] }
            ],
            order: [['badge_points', 'DESC'], ['badge_title', 'ASC']]
        });

        const pointsByBadge = badges.map((b) => ({
            badgeTitle: b.badge_title,
            badgeSlug: b.badge_slug,
            badgePoints: b.badge_points,
            badgeType: b.badge_type,
            serviceLineName: b.service_line?.service_line_name || null,
            areaName: b.area?.area_name || null
        }));

        // Active store rewards currently available to consultants.
        const rewards = await models.rewards.findAll({
            where: { is_active: true, reward_name: { [Op.ne]: null } },
            attributes: ['reward_guid', 'reward_name', 'reward_description', 'cost_points', 'reward_category', 'img_url', 'special_title'],
            order: [['cost_points', 'ASC']]
        });

        const rewardsList = rewards.map((r) => ({
            rewardGuid: r.reward_guid,
            name: r.reward_name,
            description: r.reward_description,
            costPoints: r.cost_points,
            category: r.reward_category,
            imgUrl: r.img_url || null,
            specialTitle: r.special_title || null
        }));

        return res.status(200).json({
            success: true,
            data: {
                pointsByBadge,
                rewards: rewardsList,
                badgeMilestones: BADGE_MILESTONES
            }
        });
    } catch (error) {
        logger.error('Error building gamification overview', { error });
        return res.status(500).json({ success: false, code: 'GAMIFICATION_OVERVIEW_FAILED' });
    }
};

module.exports = {
    trackInteraction,
    getInteractions,
    getPointsSummary,
    getConsultantPointsById,
    getRecommendations,
    getConsultantStats,
    getEarnedBadges,
    toggleFavorite,
    getFavorites,
    setBadgeFeatured,
    getSystemOverview
};
