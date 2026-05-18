const { Sequelize } = require('sequelize');
const { models } = require('../config/db');
const { literal } = require('sequelize');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');
const { sendTopicUpdate } = require('../services/firebase.service');

// GET /api/areas
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
const getAreas = async (req, res) => {
    try {
        const { pathSlug, slSlug } = req.params;
        let cachePrefix = 'areas:list:all';

        // If accessed via nested route, enforce Service Line (and optionally LP) parent
        if (slSlug) {
            const includeBlock = [];

            // If the URL also has the Learning Path slug, enforce that the SL belongs to that LP
            if (pathSlug) {
                includeBlock.push({
                    model: models.learning_paths,
                    as: 'learning_path',
                    where: { path_slug: pathSlug },
                    attributes: []
                });
            }

            const sl = await models.service_lines.findOne({
                where: { sl_slug: slSlug },
                include: includeBlock,
                attributes: ['service_line_id']
            });

            if (!sl) {
                return res.status(404).json({
                    success: false,
                    code: "AREA_PARENT_SL_NOT_FOUND"
                });
            }

            // Inject the ID into the query so listHelper filters by it
            req.query.service_line_id = sl.service_line_id;
            cachePrefix = `areas:list:sl:${slSlug}`;
        }

        const isAdmin = req.user?.role === 'Administrator';
        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        return handleListRequest({
            req, res,
            schema: validations.getAreasQuerySchema,
            modelName: 'areas',
            cachePrefix: cachePrefix,
            order: [['area_name', 'ASC']],
            extraAttributes: [
                [literal(`(SELECT COUNT(*) FROM progression_stages ps WHERE ps.area_id = "areas".area_id)`), 'level_count'],
                [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca WHERE ca.area_id = "areas".area_id)`), 'consultant_count'],
            ]
        });

    } catch (error) {
        logger.error('Error listing Areas', { error });
        return res.status(500).json({
            success: false,
            code: "AREA_LIST_FAILED"
        });
    }
};

// GET /api/areas/filter-stats
const getFilterStats = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const cacheKey = 'areas:filter-stats';

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, data: JSON.parse(cached) });
        }

        const sequelize = models.areas.sequelize;
        const [result] = await sequelize.query(`
            SELECT
                COALESCE(MAX(consultant_count), 0) AS "maxConsultantCount",
                COALESCE(MAX(level_count), 0)      AS "maxLevelCount"
            FROM (
                SELECT
                    a.area_id,
                    (SELECT COUNT(DISTINCT ba.user_id) FROM badge_applications ba INNER JOIN badges b ON ba.badge_id = b.badge_id WHERE b.area_id = a.area_id) AS consultant_count,
                    (SELECT COUNT(*) FROM progression_stages ps WHERE ps.area_id = a.area_id) AS level_count
                FROM areas a
            ) sub
        `, { type: Sequelize.QueryTypes.SELECT });

        const payload = {
            maxConsultantCount: parseInt(result.maxConsultantCount, 10),
            maxLevelCount: parseInt(result.maxLevelCount, 10)
        };

        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);
        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        logger.error('Error fetching Area filter stats', { error, requestId });
        return res.status(500).json({ success: false, code: "AREA_FILTER_STATS_FAILED", requestId });
    }
};

// GET /api/areas/count
const getAreasCount = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const cacheKey = 'areas:count:all';

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cached)
            });
        }

        const [active, inactive] = await Promise.all([
            models.areas.count({ where: { is_active: true } }),
            models.areas.count({ where: { is_active: false } })
        ]);

        const payload = { count: active + inactive, active, inactive };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        logger.error('Error fetching Areas count', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "AREA_COUNT_FAILED",
            requestId
        });
    }
};

// GET /api/areas/:areaSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
const getAreaBySlug = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        const whereClause = {
            area_slug: areaSlug,
            ...(isAdmin ? {} : { is_active: true })
        };

        const includeBlock = [];

        // If URL has parent slugs, enforce the hierarchy downwards
        if (slSlug) {
            const slInclude = {
                model: models.service_lines,
                as: 'service_line',
                where: { sl_slug: slSlug },
                attributes: []
            };

            // Deeply nest the Learning Path include if pathSlug exists
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

        // Hide unimportant data for non admins
        const excludeFields = isAdmin ? [] : ["is_active", "created_by", "updated_by"];

        const area = await models.areas.findOne({
            where: whereClause,
            include: includeBlock,
            attributes: {
                exclude: excludeFields
            }
        });

        if (!area) {
            return res.status(404).json({
                success: false,
                code: "AREA_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            data: area
        });

    } catch (error) {
        logger.error('Error fetching Area', { error });
        return res.status(500).json({
            success: false,
            code: "AREA_FETCH_FAILED"
        });
    }
};

const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = validations.slugQuerySchema.parse(req.query);

        const area = await models.areas.findOne({ where: { area_slug: slug } });

        return res.status(200).json({
            success: true,
            code: area ? "SLUG_IN_USE" : "SLUG_AVAILABLE",
            data: {
                isAvailable: !area
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error checking Area slug', { error });
        return res.status(500).json({
            success: false,
            code: "SLUG_CHECK_FAILED"
        });
    }
};

// POST /api/areas
// OR
// POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
const createArea = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug } = req.params;

        const {
            serviceLineId: bodyServiceLineId,
            areaName,
            areaSlug,
            areaCode,
            areaDescription,
            imgUrl
        } = validations.createAreaBodySchema.parse(req.body);

        // Resolve parent service line: prefer nested route, fall back to body
        let serviceLineId = bodyServiceLineId;

        if (slSlug) {
            const includeBlock = [];

            if (pathSlug) {
                includeBlock.push({
                    model: models.learning_paths,
                    as: 'learning_path',
                    where: { path_slug: pathSlug },
                    attributes: []
                });
            }

            const sl = await models.service_lines.findOne({
                where: { sl_slug: slSlug },
                include: includeBlock,
                attributes: ['service_line_id']
            });

            if (!sl) {
                return res.status(404).json({
                    success: false,
                    code: "AREA_PARENT_SL_NOT_FOUND"
                });
            }

            serviceLineId = sl.service_line_id;
        }

        if (!serviceLineId) {
            return res.status(400).json({
                success: false,
                code: "AREA_SERVICE_LINE_REQUIRED"
            });
        }

        // Determine and ensure unique slug
        const textToSlugify = areaSlug ? areaSlug : areaName;
        const finalUniqueSlug = await generateUniqueSlug(models.areas, 'area_slug', textToSlugify);

        // Handle Image Upload
        let finalImgUrl = imgUrl;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'areas',
                imgUrl,
                finalUniqueSlug
            );
        }

        const newArea = await models.areas.create({
            service_line_id: serviceLineId,
            area_name: areaName,
            area_slug: finalUniqueSlug,
            area_code: areaCode || null,
            area_description: areaDescription || null,
            img_url: finalImgUrl || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('areas:list');
        await invalidateCacheByPrefix('areas:count');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 11);

        return res.status(201).json({
            success: true,
            code: "AREA_CREATED",
            data: newArea
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error creating Area', { error });
        return res.status(500).json({
            success: false,
            code: "AREA_CREATE_FAILED"
        });
    }
};

// PUT /api/areas/:areaSlug
// OR
// PUT /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
const updateArea = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug } = req.params;

        const { areaSlug: currentSlug } = validations.areaSlugParamSchema.parse(req.params);

        const {
            serviceLineId,
            areaName,
            areaSlug: manualNewSlug,
            areaCode,
            areaDescription,
            imgUrl,
            isActive
        } = validations.updateAreaBodySchema.parse(req.body);

        // Enforce hierarchy if accessed through nested route
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

        const area = await models.areas.findOne({
            where: { area_slug: currentSlug },
            include: includeBlock
        });

        if (!area) {
            return res.status(404).json({
                success: false,
                code: "AREA_NOT_FOUND"
            });
        }

        let finalNewSlug = area.area_slug;

        if ((areaName && areaName !== area.area_name) || manualNewSlug) {
            const textToSlugify = manualNewSlug ? manualNewSlug : areaName;

            finalNewSlug = await generateUniqueSlug(
                models.areas,
                'area_slug',
                textToSlugify,
                area.area_id,
                'area_id'
            );
        }

        let finalImgUrl = imgUrl !== undefined ? imgUrl : area.img_url;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'areas',
                imgUrl,
                finalNewSlug
            );
        }

        await area.update({
            service_line_id: serviceLineId !== undefined ? serviceLineId : area.service_line_id,
            area_name: areaName !== undefined ? areaName : area.area_name,
            area_slug: finalNewSlug,
            area_code: areaCode !== undefined ? areaCode : area.area_code,
            area_description: areaDescription !== undefined ? areaDescription : area.area_description,
            img_url: finalImgUrl,
            is_active: isActive !== undefined ? isActive : area.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('areas:list');
        await invalidateCacheByPrefix('areas:count');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 11);

        return res.status(200).json({
            success: true,
            code: "AREA_UPDATED",
            data: area
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error updating Area', { error });
        return res.status(500).json({
            success: false,
            code: "AREA_UPDATE_FAILED"
        });
    }
};

// DELETE /api/areas/:areaSlug
// OR
// DELETE /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug
const deleteArea = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug } = req.params;

        const { areaSlug } = validations.areaSlugParamSchema.parse(req.params);

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

        const area = await models.areas.findOne({
            where: { area_slug: areaSlug },
            include: includeBlock
        });

        if (!area) {
            return res.status(404).json({
                success: false,
                code: "AREA_NOT_FOUND"
            });
        }

        if (!area.is_active) {
            return res.status(400).json({
                success: false,
                code: "AREA_ALREADY_INACTIVE"
            });
        }

        await area.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('areas:list');
        await invalidateCacheByPrefix('areas:count');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 11);

        return res.status(200).json({
            success: true,
            code: "AREA_DEACTIVATED"
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_URL_PARAM"
            });
        }

        logger.error('Error deleting Area', { error });
        return res.status(500).json({
            success: false,
            code: "AREA_DELETE_FAILED"
        });
    }
};

const getFilterStats = async (req, res) => {
    const cacheKey = 'areas:filter-stats';
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const rows = await models.areas.findAll({
            attributes: [
                [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca WHERE ca.area_id = "areas".area_id)`), 'consultant_count'],
                [literal(`(SELECT COUNT(*) FROM progression_stages ps WHERE ps.area_id = "areas".area_id)`), 'level_count'],
            ],
            raw: true,
        });

        const maxConsultantCount = Math.max(0, ...rows.map(r => Number(r.consultant_count || 0)));
        const maxLevelCount = Math.max(0, ...rows.map(r => Number(r.level_count || 0)));

        const payload = { maxConsultantCount, maxLevelCount };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);
        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        logger.error('Error fetching areas filter stats', { error });
        return res.status(500).json({ success: false, code: 'AREA_FILTER_STATS_FAILED' });
    }
};

module.exports = {
    getAreas,
    getFilterStats,
    getAreasCount,
    getAreaBySlug,
    checkSlugAvailability,
    createArea,
    updateArea,
    deleteArea,
    getFilterStats
};
