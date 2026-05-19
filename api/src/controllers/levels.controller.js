const { literal } = require('sequelize');
const { models } = require('../config/db');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { sendTopicUpdate } = require('../services/firebase.service');

// GET /api/levels
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
const getLevels = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug } = req.params;
        let cachePrefix = 'levels:list:all';
        let baseWhere = {};

        if (areaSlug) {
            const includeBlock = [];

            if (slSlug) {
                const slInclude = {
                    model: models.service_lines,
                    as: 'service_line',
                    where: { sl_slug: slSlug },
                    attributes: []
                };

                if (pathSlug) {
                    slInclude.include = [{
                        model: models.learning_paths,
                        as: 'learning_path',
                        where: { path_slug: pathSlug },
                        attributes: []
                    }];
                }
                includeBlock.push(slInclude);
            }

            // Get area ID
            const area = await models.areas.findOne({
                where: { area_slug: areaSlug },
                include: includeBlock,
                attributes: ['area_id']
            });

            if (!area) {
                return res.status(404).json({
                    success: false,
                    code: "LEVEL_PARENT_AREA_NOT_FOUND"
                });
            }

            baseWhere = { area_id: area.area_id };
            cachePrefix = `levels:list:area:${areaSlug}`;
        }

        return handleListRequest({
            req, res,
            schema: validations.getLevelsQuerySchema,
            modelName: 'progression_stages',
            cachePrefix: cachePrefix,
            baseWhere,
            order: [['stage_sequence', 'ASC']],
            include: [
                {
                    model: models.stage_codes,
                    as: 'stage_code',
                    attributes: ['stage_code']
                },
                {
                    model: models.areas,
                    as: 'area',
                    attributes: ['area_name', 'area_slug']
                }
            ],
            extraAttributes: [
                [literal(`(SELECT COUNT(*) FROM badges b WHERE b.progression_stage_id = "progression_stages".progression_stage_id)`), 'badge_count'],
                [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id)`), 'consultant_count'],
            ]
        });

    } catch (error) {
        logger.error('Error listing Levels', { error });
        return res.status(500).json({
            success: false,
            code: "LEVEL_LIST_FAILED"
        });
    }
};

// GET /api/levels/count
const getLevelsCount = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const cacheKey = 'levels:count:all';

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cached)
            });
        }

        const [active, inactive] = await Promise.all([
            models.progression_stages.count({ where: { is_active: true } }),
            models.progression_stages.count({ where: { is_active: false } })
        ]);

        const payload = { count: active + inactive, active, inactive };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        logger.error('Error fetching Levels count', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "LEVEL_COUNT_FAILED",
            requestId
        });
    }
};

// GET /api/levels/:stageCode
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
const getLevelByCode = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;
        const isAdmin = req.user?.role === 'Administrator';
        const isNumeric = /^\d+$/.test(stageCode);

        // JOIN stage_codes to filter
        const includeBlock = [
            {
                model: models.stage_codes,
                as: 'stage_code',
                ...(isNumeric ? {} : { where: { stage_code: stageCode } })
            }
        ];

        const lpInclude = {
            model: models.learning_paths,
            as: 'learning_path',
            attributes: ['path_title', 'path_slug'],
        };
        if (pathSlug) {
            lpInclude.where = { path_slug: pathSlug };
        }

        const slInclude = {
            model: models.service_lines,
            as: 'service_line',
            attributes: ['service_line_name', 'sl_slug'],
            include: [lpInclude],
        };
        if (slSlug) {
            slInclude.where = { sl_slug: slSlug };
        }

        const areaInclude = {
            model: models.areas,
            as: 'area',
            attributes: ['area_name', 'area_slug'],
            include: [slInclude],
        };
        if (areaSlug) {
            areaInclude.where = { area_slug: areaSlug };
        }
        includeBlock.push(areaInclude);

        // /api/levels/:stageCode
        if (!areaSlug) {
            const userId = req.user?.sub;
            const baseWhere = isNumeric ? { progression_stage_id: parseInt(stageCode, 10) } : {};

            return handleListRequest({
                req, res,
                baseWhere,
                schema: validations.getLevelsQuerySchema,
                modelName: 'progression_stages',
                cachePrefix: `levels:list:code:${stageCode}`,
                include: includeBlock,
                order: [['stage_sequence', 'ASC']],
                extraAttributes: [
                    [literal(`(SELECT COUNT(*) FROM badges b WHERE b.progression_stage_id = "progression_stages".progression_stage_id)`), 'badge_count'],
                    [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id)`), 'consultant_count'],
                    [literal(`(SELECT EXISTS(SELECT 1 FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id AND ca.user_id = ${userId ? Number(userId) : 0}))`), 'is_enrolled'],
                ]
            });
        }

        const excludeFields = isAdmin ? [] : ["created_by", "updated_by"];
        const userId = req.user?.sub;

        const level = await models.progression_stages.findOne({
            include: includeBlock,
            attributes: {
                exclude: excludeFields,
                include: [
                    [literal(`(SELECT COUNT(*) FROM badges b WHERE b.progression_stage_id = "progression_stages".progression_stage_id)`), 'badge_count'],
                    [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id)`), 'consultant_count'],
                    [literal(`(SELECT EXISTS(SELECT 1 FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id AND ca.user_id = ${userId ? Number(userId) : 0}))`), 'is_enrolled'],
                ]
            }
        });

        if (!level) {
            return res.status(404).json({
                success: false,
                code: "LEVEL_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            data: level
        });

    } catch (error) {
        logger.error('Error fetching Level', { error });
        return res.status(500).json({
            success: false,
            code: "LEVEL_FETCH_FAILED"
        });
    }
};

// Helper: resolve area context from nested route slugs
const resolveAreaFromHierarchy = async ({ areaSlug, slSlug, pathSlug }) => {
    const includeBlock = [];

    if (slSlug) {
        const slInclude = {
            model: models.service_lines,
            as: 'service_line',
            where: { sl_slug: slSlug },
            attributes: []
        };

        if (pathSlug) {
            slInclude.include = [{
                model: models.learning_paths,
                as: 'learning_path',
                where: { path_slug: pathSlug },
                attributes: []
            }];
        }
        includeBlock.push(slInclude);
    }

    return models.areas.findOne({
        where: { area_slug: areaSlug },
        include: includeBlock,
        attributes: ['area_id']
    });
};

// Helper: find or create stage_code by string
const getOrCreateStageCode = async (stageCode, userId) => {
    let row = await models.stage_codes.findOne({ where: { stage_code: stageCode } });
    if (row) return row;

    return models.stage_codes.create({
        stage_code: stageCode,
        created_by: userId,
        updated_by: userId
    });
};

// POST /api/levels
// OR
// POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
const createLevel = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug } = req.params;

        const {
            areaId: bodyAreaId,
            stageCode,
            stageTitle,
            stageSequence,
            stageDescription
        } = validations.createLevelBodySchema.parse(req.body);

        // Resolve parent area: prefer nested route, fall back to body
        let areaId = bodyAreaId;

        if (areaSlug) {
            const area = await resolveAreaFromHierarchy({ areaSlug, slSlug, pathSlug });
            if (!area) {
                return res.status(404).json({
                    success: false,
                    code: "LEVEL_PARENT_AREA_NOT_FOUND"
                });
            }
            areaId = area.area_id;
        }

        if (!areaId) {
            return res.status(400).json({
                success: false,
                code: "LEVEL_AREA_ID_REQUIRED"
            });
        }

        const stageCodeRow = await getOrCreateStageCode(stageCode, userId);

        const newLevel = await models.progression_stages.create({
            area_id: areaId,
            stage_code_id: stageCodeRow.stage_code_id,
            stage_title: stageTitle,
            stage_sequence: stageSequence ?? null,
            stage_description: stageDescription || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('levels:list');
        await invalidateCacheByPrefix('levels:count');
        await redis.del('levels:filter-stats');
        await invalidateCacheByPrefix('areas:list');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 12);
        await sendTopicUpdate("new_data", 13);

        return res.status(201).json({
            success: true,
            code: "LEVEL_CREATED",
            data: newLevel
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error creating Level', { error });
        return res.status(500).json({
            success: false,
            code: "LEVEL_CREATE_FAILED"
        });
    }
};

// Helper: locate a progression_stage by stage_code (and optional hierarchy)
const findLevelInHierarchy = async ({ stageCode, areaSlug, slSlug, pathSlug }) => {
    const includeBlock = [
        {
            model: models.stage_codes,
            as: 'stage_code',
            where: { stage_code: stageCode }
        }
    ];

    if (areaSlug) {
        const areaInclude = {
            model: models.areas,
            as: 'area',
            where: { area_slug: areaSlug },
            attributes: []
        };

        if (slSlug) {
            const slInclude = {
                model: models.service_lines,
                as: 'service_line',
                where: { sl_slug: slSlug },
                attributes: []
            };

            if (pathSlug) {
                slInclude.include = [{
                    model: models.learning_paths,
                    as: 'learning_path',
                    where: { path_slug: pathSlug },
                    attributes: []
                }];
            }
            areaInclude.include = [slInclude];
        }
        includeBlock.push(areaInclude);
    }

    return models.progression_stages.findOne({ include: includeBlock });
};

// PUT /api/levels/:stageCode
// OR
// PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
const updateLevel = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug } = req.params;

        const { stageCode } = validations.stageCodeParamSchema.parse(req.params);

        const {
            areaId,
            stageCode: newStageCode,
            stageTitle,
            stageSequence,
            stageDescription,
            isActive
        } = validations.updateLevelBodySchema.parse(req.body);

        const level = await findLevelInHierarchy({ stageCode, areaSlug, slSlug, pathSlug });

        if (!level) {
            return res.status(404).json({
                success: false,
                code: "LEVEL_NOT_FOUND"
            });
        }

        let stageCodeId = level.stage_code_id;
        if (newStageCode && newStageCode !== stageCode) {
            const stageCodeRow = await getOrCreateStageCode(newStageCode, userId);
            stageCodeId = stageCodeRow.stage_code_id;
        }

        await level.update({
            area_id: areaId !== undefined ? areaId : level.area_id,
            stage_code_id: stageCodeId,
            stage_title: stageTitle !== undefined ? stageTitle : level.stage_title,
            stage_sequence: stageSequence !== undefined ? stageSequence : level.stage_sequence,
            stage_description: stageDescription !== undefined ? stageDescription : level.stage_description,
            is_active: isActive !== undefined ? isActive : level.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('levels:list');
        await invalidateCacheByPrefix('levels:count');
        await redis.del('levels:filter-stats');
        await invalidateCacheByPrefix('areas:list');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 12);
        await sendTopicUpdate("new_data", 13);

        return res.status(200).json({
            success: true,
            code: "LEVEL_UPDATED",
            data: level
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error updating Level', { error });
        return res.status(500).json({
            success: false,
            code: "LEVEL_UPDATE_FAILED"
        });
    }
};

// DELETE /api/levels/:stageCode
// OR
// DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
const deleteLevel = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug } = req.params;

        const { stageCode } = validations.stageCodeParamSchema.parse(req.params);

        const level = await findLevelInHierarchy({ stageCode, areaSlug, slSlug, pathSlug });

        if (!level) {
            return res.status(404).json({
                success: false,
                code: "LEVEL_NOT_FOUND"
            });
        }

        if (!level.is_active) {
            return res.status(400).json({
                success: false,
                code: "LEVEL_ALREADY_INACTIVE"
            });
        }

        await level.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('levels:list');
        await invalidateCacheByPrefix('levels:count');
        await redis.del('levels:filter-stats');
        await invalidateCacheByPrefix('areas:list');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 12);

        return res.status(200).json({
            success: true,
            code: "LEVEL_DEACTIVATED"
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_URL_PARAM"
            });
        }

        logger.error('Error deleting Level', { error });
        return res.status(500).json({
            success: false,
            code: "LEVEL_DELETE_FAILED"
        });
    }
};

const getFilterStats = async (req, res) => {
    const cacheKey = 'levels:filter-stats';
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const rows = await models.progression_stages.findAll({
            attributes: [
                [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id WHERE a.area_id = "progression_stages".area_id)`), 'consultant_count'],
                [literal(`(SELECT COUNT(*) FROM badges b WHERE b.progression_stage_id = "progression_stages".progression_stage_id)`), 'badge_count'],
            ],
            raw: true,
        });

        const maxConsultantCount = Math.max(0, ...rows.map(r => Number(r.consultant_count || 0)));
        const maxBadgeCount = Math.max(0, ...rows.map(r => Number(r.badge_count || 0)));

        const payload = { maxConsultantCount, maxBadgeCount };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);
        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        logger.error('Error fetching levels filter stats', { error });
        return res.status(500).json({ success: false, code: 'LEVEL_FILTER_STATS_FAILED' });
    }
};

module.exports = {
    getLevels,
    getFilterStats,
    getLevelsCount,
    getLevelByCode,
    createLevel,
    updateLevel,
    deleteLevel,
};
