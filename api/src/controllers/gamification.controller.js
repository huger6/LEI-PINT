const { models } = require('../config/db');
const { Op } = require('sequelize');
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

module.exports = {
    trackInteraction,
    getInteractions,
    getPointsSummary,
    getConsultantPointsById,
    getRecommendations
};
