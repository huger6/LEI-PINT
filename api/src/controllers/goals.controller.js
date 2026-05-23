const { models, sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/goals.validation');

const getGoals = async (req, res) => {
    try {
        const userId = req.user.sub;

        const goals = await models.goals.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: models.badges,
                    as: 'badge_badge',
                    attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url', 'badge_points',
                        'progression_stage_id', 'learning_path_id', 'expiration_duration_days'],
                    include: [
                        {
                            model: models.progression_stages,
                            as: 'progression_stage',
                            attributes: ['progression_stage_id', 'stage_title'],
                            include: [{
                                model: models.stage_codes,
                                as: 'stage_code',
                                attributes: ['stage_code']
                            }]
                        },
                        {
                            model: models.learning_paths,
                            as: 'learning_path',
                            attributes: ['learning_path_id', 'path_title', 'path_slug']
                        },
                        {
                            model: models.badge_requirements,
                            as: 'badge_requirements',
                            where: { is_active: true },
                            required: false,
                            attributes: ['requirement_id']
                        }
                    ]
                },
                {
                    model: models.badge_applications,
                    as: 'application',
                    attributes: ['application_id', 'application_state', 'opened_at', 'submitted_at'],
                    required: false,
                    include: [{
                        model: models.requirements_evidences,
                        as: 'requirements_evidences',
                        attributes: ['evidence_id'],
                        required: false
                    }]
                }
            ],
            order: [['event_end_date', 'ASC NULLS LAST']]
        });

        return res.status(200).json({
            success: true,
            code: 'GOALS_RETRIEVED',
            data: goals
        });

    } catch (error) {
        logger.error('Error fetching goals', { error });
        return res.status(500).json({ success: false, code: 'GOALS_FETCH_FAILED' });
    }
};

const createGoal = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { badgeId, eventTitle, eventDescription, eventStartDate, eventEndDate, reminderAt } =
            validations.createGoalSchema.parse(req.body);

        const badge = await models.badges.findByPk(badgeId);
        if (!badge || !badge.is_active) {
            return res.status(404).json({ success: false, code: 'GOALS_BADGE_NOT_FOUND' });
        }

        const existing = await models.goals.findOne({
            where: { user_id: userId, badge_id: badgeId }
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                code: 'GOALS_ALREADY_EXISTS',
                data: { goalId: existing.goal_id }
            });
        }

        const goal = await models.goals.create({
            user_id: userId,
            badge_id: badgeId,
            event_title: eventTitle,
            event_description: eventDescription || null,
            event_start_date: eventStartDate || null,
            event_end_date: eventEndDate || null,
            reminder_at: reminderAt || null
        });

        return res.status(201).json({
            success: true,
            code: 'GOAL_CREATED',
            data: goal
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error creating goal', { error });
        return res.status(500).json({ success: false, code: 'GOAL_CREATE_FAILED' });
    }
};

const updateGoal = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { goalId } = validations.goalIdParamSchema.parse(req.params);
        const updates = validations.updateGoalSchema.parse(req.body);

        const goal = await models.goals.findOne({
            where: { goal_id: goalId, user_id: userId }
        });

        if (!goal) {
            return res.status(404).json({ success: false, code: 'GOAL_NOT_FOUND' });
        }

        const fieldMap = {
            eventTitle: 'event_title',
            eventDescription: 'event_description',
            eventStartDate: 'event_start_date',
            eventEndDate: 'event_end_date',
            reminderAt: 'reminder_at'
        };

        const dbUpdates = {};
        for (const [key, col] of Object.entries(fieldMap)) {
            if (key in updates) dbUpdates[col] = updates[key];
        }

        await goal.update(dbUpdates);

        return res.status(200).json({
            success: true,
            code: 'GOAL_UPDATED',
            data: goal
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error updating goal', { error });
        return res.status(500).json({ success: false, code: 'GOAL_UPDATE_FAILED' });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { goalId } = validations.goalIdParamSchema.parse(req.params);

        const goal = await models.goals.findOne({
            where: { goal_id: goalId, user_id: userId }
        });

        if (!goal) {
            return res.status(404).json({ success: false, code: 'GOAL_NOT_FOUND' });
        }

        await goal.destroy();

        return res.status(200).json({
            success: true,
            code: 'GOAL_DELETED'
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error deleting goal', { error });
        return res.status(500).json({ success: false, code: 'GOAL_DELETE_FAILED' });
    }
};

const getGoalStats = async (req, res) => {
    try {
        const userId = req.user.sub;

        const [statsRows] = await sequelize.query(
            `SELECT
                COUNT(g.goal_id)::int AS active_objectives,

                COALESCE(
                    MIN(
                        CASE WHEN g.event_end_date > NOW()
                             THEN EXTRACT(DAY FROM g.event_end_date - NOW())::int
                        END
                    ), 0
                ) AS days_to_next,

                (SELECT COUNT(*)::int
                 FROM awarded_badges ab
                 WHERE ab.user_id = :userId
                   AND ab.expiration_at IS NOT NULL
                   AND ab.expiration_at <= NOW() + INTERVAL '90 days'
                   AND ab.expiration_at > NOW()
                ) AS badges_expiring,

                (SELECT COUNT(*)::int
                 FROM awarded_badges ab
                 WHERE ab.user_id = :userId
                ) AS completed_objectives

            FROM goals g
            WHERE g.user_id = :userId`,
            { replacements: { userId } }
        );

        return res.status(200).json({
            success: true,
            code: 'GOAL_STATS_RETRIEVED',
            data: statsRows[0] || {
                active_objectives: 0,
                days_to_next: 0,
                badges_expiring: 0,
                completed_objectives: 0
            }
        });

    } catch (error) {
        logger.error('Error fetching goal stats', { error });
        return res.status(500).json({ success: false, code: 'GOAL_STATS_FAILED' });
    }
};

const getProgressionTimeline = async (req, res) => {
    try {
        const userId = req.user.sub;

        const [rows] = await sequelize.query(
            `SELECT
                sc.stage_code                       AS code,
                ps.stage_title                      AS title,
                ps.stage_sequence,
                COUNT(b.badge_id)::int              AS total_badges,
                COUNT(ab.awarded_badges_id)::int    AS earned_badges,
                MIN(ab.awarded_at)                  AS first_awarded,
                MAX(ab.awarded_at)                  AS last_awarded
            FROM stage_codes sc
            JOIN progression_stages ps ON ps.stage_code_id = sc.stage_code_id AND ps.is_active = TRUE
            LEFT JOIN badges b ON b.progression_stage_id = ps.progression_stage_id AND b.is_active = TRUE
            LEFT JOIN badge_applications ba ON ba.badge_id = b.badge_id AND ba.user_id = :userId
            LEFT JOIN awarded_badges ab ON ab.application_id = ba.application_id AND ab.user_id = :userId
            GROUP BY sc.stage_code_id, sc.stage_code, ps.progression_stage_id, ps.stage_title, ps.stage_sequence
            ORDER BY ps.stage_sequence DESC`,
            { replacements: { userId } }
        );

        return res.status(200).json({
            success: true,
            code: 'GOAL_TIMELINE_RETRIEVED',
            data: rows
        });

    } catch (error) {
        logger.error('Error fetching progression timeline', { error });
        return res.status(500).json({ success: false, code: 'GOAL_TIMELINE_FAILED' });
    }
};

module.exports = {
    getGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalStats,
    getProgressionTimeline
};
