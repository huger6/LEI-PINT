const { models } = require('../config/db');
const { Op } = require('sequelize');
const { invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { handleZodError } = require('../utils/responseHelper');
const { sendTopicUpdate } = require('../services/firebase.service');
const { findBadgeInHierarchy } = require('./badges.controller');

// Invalidate every cache key that embeds requirements (badge list/single and
// level lists carry badge data), mirroring badge mutations.
const invalidateRequirementCaches = async () => {
    await invalidateCacheByPrefix('badges:list');
    await invalidateCacheByPrefix('levels:list');
    await redis.del('levels:filter-stats');
    await sendTopicUpdate('new_data', 14);
};

// GET /api/badges/:badgeSlug/requirements (also via nested hierarchy paths)
const getRequirements = async (req, res) => {
    try {
        const { badgeSlug, stageCode, areaSlug, slSlug, pathSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        const { synced_at, is_active } = validations.getRequirementsQuerySchema.parse(req.query);

        const badge = await findBadgeInHierarchy({ badgeSlug, stageCode, areaSlug, slSlug, pathSlug });
        if (!badge) {
            return res.status(404).json({ success: false, code: 'BADGE_NOT_FOUND' });
        }

        const where = { badge_id: badge.badge_id };
        if (!isAdmin) {
            where.is_active = true;
        } else if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (synced_at) {
            where.updated_at = { [Op.gt]: synced_at };
        }

        const requirements = await models.badge_requirements.findAll({
            where,
            attributes: { exclude: isAdmin ? [] : ['is_active', 'created_by', 'updated_by'] },
            order: [['requirement_sequence', 'ASC'], ['requirement_id', 'ASC']]
        });

        return res.status(200).json({ success: true, data: requirements });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY');

        logger.error('Error listing badge requirements', { error });
        return res.status(500).json({ success: false, code: 'REQUIREMENT_LIST_FAILED' });
    }
};

// POST /api/badges/:badgeSlug/requirements
const createRequirement = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { badgeSlug, stageCode, areaSlug, slSlug, pathSlug } = req.params;

        const {
            requirementTitle,
            requirementDescription,
            requirementSequence,
            badgePoints
        } = validations.createRequirementBodySchema.parse(req.body);

        const badge = await findBadgeInHierarchy({ badgeSlug, stageCode, areaSlug, slSlug, pathSlug });
        if (!badge) {
            return res.status(404).json({ success: false, code: 'BADGE_NOT_FOUND' });
        }

        const newRequirement = await models.badge_requirements.create({
            badge_id: badge.badge_id,
            progression_stage_id: badge.progression_stage_id,
            requirement_title: requirementTitle,
            requirement_description: requirementDescription,
            requirement_sequence: requirementSequence ?? null,
            badge_points: badgePoints,
            is_active: true,
            created_by: userId,
            updated_by: userId
        });

        await invalidateRequirementCaches();

        return res.status(201).json({ success: true, code: 'REQUIREMENT_CREATED', data: newRequirement });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error creating badge requirement', { error });
        return res.status(500).json({ success: false, code: 'REQUIREMENT_CREATE_FAILED' });
    }
};

// PUT /api/badges/:badgeSlug/requirements/:requirementId
const updateRequirement = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { badgeSlug, stageCode, areaSlug, slSlug, pathSlug } = req.params;
        const { requirementId } = validations.requirementIdParamSchema.parse(req.params);

        const {
            requirementTitle,
            requirementDescription,
            requirementSequence,
            badgePoints,
            isActive
        } = validations.updateRequirementBodySchema.parse(req.body);

        const badge = await findBadgeInHierarchy({ badgeSlug, stageCode, areaSlug, slSlug, pathSlug });
        if (!badge) {
            return res.status(404).json({ success: false, code: 'BADGE_NOT_FOUND' });
        }

        const requirement = await models.badge_requirements.findOne({
            where: { requirement_id: requirementId, badge_id: badge.badge_id }
        });
        if (!requirement) {
            return res.status(404).json({ success: false, code: 'REQUIREMENT_NOT_FOUND' });
        }

        await requirement.update({
            requirement_title: requirementTitle !== undefined ? requirementTitle : requirement.requirement_title,
            requirement_description: requirementDescription !== undefined ? requirementDescription : requirement.requirement_description,
            requirement_sequence: requirementSequence !== undefined ? requirementSequence : requirement.requirement_sequence,
            badge_points: badgePoints !== undefined ? badgePoints : requirement.badge_points,
            is_active: isActive !== undefined ? isActive : requirement.is_active,
            updated_by: userId,
            updated_at: new Date()
        });

        await invalidateRequirementCaches();

        return res.status(200).json({ success: true, code: 'REQUIREMENT_UPDATED', data: requirement });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error updating badge requirement', { error });
        return res.status(500).json({ success: false, code: 'REQUIREMENT_UPDATE_FAILED' });
    }
};

// DELETE /api/badges/:badgeSlug/requirements/:requirementId (soft delete)
const deleteRequirement = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { badgeSlug, stageCode, areaSlug, slSlug, pathSlug } = req.params;
        const { requirementId } = validations.requirementIdParamSchema.parse(req.params);

        const badge = await findBadgeInHierarchy({ badgeSlug, stageCode, areaSlug, slSlug, pathSlug });
        if (!badge) {
            return res.status(404).json({ success: false, code: 'BADGE_NOT_FOUND' });
        }

        const requirement = await models.badge_requirements.findOne({
            where: { requirement_id: requirementId, badge_id: badge.badge_id }
        });
        if (!requirement) {
            return res.status(404).json({ success: false, code: 'REQUIREMENT_NOT_FOUND' });
        }

        if (!requirement.is_active) {
            return res.status(400).json({ success: false, code: 'REQUIREMENT_ALREADY_INACTIVE' });
        }

        await requirement.update({ is_active: false, updated_by: userId, updated_at: new Date() });

        await invalidateRequirementCaches();

        return res.status(200).json({ success: true, code: 'REQUIREMENT_DEACTIVATED' });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_URL_PARAM');

        logger.error('Error deleting badge requirement', { error });
        return res.status(500).json({ success: false, code: 'REQUIREMENT_DELETE_FAILED' });
    }
};

module.exports = {
    getRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement
};
