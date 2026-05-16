const { models } = require('../config/db');
const { Op } = require('sequelize');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');
const { sendTopicUpdate } = require('../services/firebase.service');

// GET /api/service-lines
// OR
// GET /api/learning-paths/:pathSlug/service-lines
const getServiceLines = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    try {
        const { pathSlug } = req.params;
        let cachePrefix = 'sl:list:all';

        // If accessed via nested route, enforce Learning Path parent
        if (pathSlug) {
            const lp = await models.learning_paths.findOne({
                where: { path_slug: pathSlug },
                attributes: ['learning_path_id']
            });

            if (!lp) {
                return res.status(404).json({
                    success: false,
                    code: "SL_PARENT_LP_NOT_FOUND"
                });
            }

            // Inject the ID into the query so listHelper filters by it
            req.query.learning_path_id = lp.learning_path_id;
            cachePrefix = `sl:list:lp:${pathSlug}`;
        }

        return handleListRequest({
            req, res,
            schema: validations.getServiceLinesQuerySchema,
            modelName: 'service_lines',
            cachePrefix: cachePrefix,
            order: [['service_line_name', 'ASC']]
        });

    } catch (error) {
        logger.error('Error listing Service Lines', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "SL_LIST_FAILED",
            requestId
        });
    }
};

// GET /api/service-lines/count
const getServiceLinesCount = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const cacheKey = 'sl:count:all';

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cached)
            });
        }

        const [active, inactive] = await Promise.all([
            models.service_lines.count({ where: { is_active: true } }),
            models.service_lines.count({ where: { is_active: false } })
        ]);

        const payload = { count: active + inactive, active, inactive };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        logger.error('Error fetching Service Lines count', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "SL_COUNT_FAILED",
            requestId
        });
    }
};

// GET /api/service-lines/:slSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug
const getServiceLineBySlug = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    try {
        const { pathSlug, slSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        const whereClause = {
            sl_slug: slSlug,
            ...(isAdmin ? {} : { is_active: true })
        };

        const includeBlock = [];

        // Enforce hierarchy if pathSlug is present in the URL
        if (pathSlug) {
            includeBlock.push({
                model: models.learning_paths,
                as: 'learning_path',
                where: { path_slug: pathSlug },
                attributes: []
            });
        }

        // Hide unimportant data for non admins
        const excludeFields = isAdmin ? [] : ["is_active", "created_by", "updated_by"];

        const sl = await models.service_lines.findOne({
            where: whereClause,
            include: includeBlock,
            attributes: {
                exclude: excludeFields
            }
        });

        if (!sl) {
            return res.status(404).json({
                success: false,
                code: "SL_NOT_FOUND"
            });
        }

        return res.status(200).json({ success: true, data: sl });

    } catch (error) {
        logger.error('Error fetching Service Line', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "SL_FETCH_FAILED",
            requestId
        });
    }
};

const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = req.query;
        if (!slug) {
            return res.status(400).json({
                success: false,
                code: "SL_SLUG_REQUIRED"
            });
        }

        const sl = await models.service_lines.findOne({ where: { sl_slug: slug } });

        return res.status(200).json({
            success: true,
            code: sl ? "SLUG_IN_USE" : "SLUG_AVAILABLE",
            data: {
                isAvailable: !sl
            }
        });

    } catch (error) {
        logger.error('Error checking SL slug', { error });
        return res.status(500).json({
            success: false,
            code: "SLUG_CHECK_FAILED"
        });
    }
};

const createServiceLine = async (req, res) => {
    try {
        const userId = req.user.sub; // Admin ID

        // Extract parent pathSlug from URL if this route is nested, otherwise
        // allow the caller to provide the parent learningPathId directly.
        const { pathSlug } = req.params.pathSlug
            ? validations.pathSlugParamSchema.parse(req.params)
            : { pathSlug: null };

        const { learningPathId, serviceLineName, slSlug, serviceLineDescription, imgUrl } = validations.createServiceLineBodySchema.parse(req.body);

        // Find the parent Learning Path
        const lp = learningPathId
            ? await models.learning_paths.findByPk(learningPathId)
            : await models.learning_paths.findOne({ where: { path_slug: pathSlug } });
        if (!lp) {
            return res.status(404).json({
                success: false,
                code: "SL_PARENT_LP_NOT_FOUND"
            });
        }

        // Determine and ensure unique slug
        const textToSlugify = slSlug ? slSlug : serviceLineName;
        const finalUniqueSlug = await generateUniqueSlug(models.service_lines, 'sl_slug', textToSlugify);

        // Handle Image Upload
        let finalImgUrl = imgUrl;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'service-lines',
                imgUrl,
                finalUniqueSlug
            );
        }

        // Create Service Line in DB
        const newSl = await models.service_lines.create({
            learning_path_id: lp.learning_path_id,
            service_line_name: serviceLineName,
            sl_slug: finalUniqueSlug,
            service_line_description: serviceLineDescription || null,
            img_url: finalImgUrl || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('sl:list');
        await invalidateCacheByPrefix('sl:count');
        await sendTopicUpdate("new_data", 10);

        return res.status(201).json({
            success: true,
            code: "SL_CREATED",
            data: newSl
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error creating Service Line', { error });
        return res.status(500).json({
            success: false,
            code: "SL_CREATE_FAILED"
        });
    }
};

const updateServiceLine = async (req, res) => {
    try {
        const userId = req.user.sub;

        // Rename the slug from params to avoid conflict with the optional slug from body
        const { slSlug: currentSlug } = validations.slSlugParamSchema.parse(req.params);

        const {
            serviceLineName,
            slSlug: manualNewSlug,
            serviceLineDescription,
            imgUrl,
            isActive
        } = validations.updateServiceLineBodySchema.parse(req.body);

        // Find existing Service Line
        const sl = await models.service_lines.findOne({ where: { sl_slug: currentSlug } });
        if (!sl) {
            return res.status(404).json({
                success: false,
                code: "SL_NOT_FOUND_BY_SLUG"
            });
        }

        let finalNewSlug = sl.sl_slug;

        // Update Slug if name changed or manual slug provided
        if ((serviceLineName && serviceLineName !== sl.service_line_name) || manualNewSlug) {
            const textToSlugify = manualNewSlug ? manualNewSlug : serviceLineName;

            // Generate unique slug ignoring the current record's ID
            finalNewSlug = await generateUniqueSlug(
                models.service_lines,
                'sl_slug',
                textToSlugify,
                sl.service_line_id,
                'service_line_id'
            );
        }

        // Handle Image Move if a new temporary image is provided
        let finalImgUrl = imgUrl !== undefined ? imgUrl : sl.img_url;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'service-lines',
                imgUrl,
                finalNewSlug
            );
        }

        // Update in DB
        await sl.update({
            service_line_name: serviceLineName !== undefined ? serviceLineName : sl.service_line_name,
            sl_slug: finalNewSlug,
            service_line_description: serviceLineDescription !== undefined ? serviceLineDescription : sl.service_line_description,
            img_url: finalImgUrl,
            is_active: isActive !== undefined ? isActive : sl.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('sl:list');
        await invalidateCacheByPrefix('sl:count');
        await sendTopicUpdate("new_data", 10);

        return res.status(200).json({
            success: true,
            code: "SL_UPDATED",
            data: sl
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error updating Service Line', { error });
        return res.status(500).json({
            success: false,
            code: "SL_UPDATE_FAILED"
        });
    }
};

const deleteServiceLine = async (req, res) => {
    try {
        const userId = req.user.sub;

        const { slSlug } = validations.slSlugParamSchema.parse(req.params);

        const sl = await models.service_lines.findOne({ where: { sl_slug: slSlug } });

        if (!sl) {
            return res.status(404).json({
                success: false,
                code: "SL_NOT_FOUND_BY_SLUG"
            });
        }

        if (!sl.is_active) {
            return res.status(400).json({
                success: false,
                code: "SL_ALREADY_INACTIVE"
            });
        }

        // Soft delete
        await sl.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('sl:list');
        await invalidateCacheByPrefix('sl:count');
        await sendTopicUpdate("new_data", 10);

        return res.status(200).json({
            success: true,
            code: "SL_DEACTIVATED"
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_URL_PARAM"
            });
        }

        logger.error('Error deleting Service Line', { error });
        return res.status(500).json({
            success: false,
            code: "SL_DELETE_FAILED"
        });
    }
};


module.exports = {
    getServiceLines,
    getServiceLinesCount,
    getServiceLineBySlug,
    checkSlugAvailability,
    createServiceLine,
    updateServiceLine,
    deleteServiceLine
};
