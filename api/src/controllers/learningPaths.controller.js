const { literal } = require('sequelize');
const { models } = require('../config/db');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');
const { sendTopicUpdate } = require('../services/firebase.service');

// GET /api/learning-paths
const getAllLearningPaths = (req, res) => {
    const isAdmin = req.user?.role === 'Administrator';
    const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

    return handleListRequest({
        req, res,
        schema: validations.getAvailableLearningPathsQuerySchema,
        modelName: 'learning_paths',
        cachePrefix: 'lp:list',
        order: [['path_title', 'ASC']],
        extraAttributes: [
            [literal(`(SELECT COUNT(*) FROM service_lines sl WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'service_line_count'],
            [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'consultant_count'],
        ]
    });
};

// GET /api/learning-paths/count
const getLearningPathsCount = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const cacheKey = 'lp:count:all';

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cached)
            });
        }

        const [active, inactive] = await Promise.all([
            models.learning_paths.count({ where: { is_active: true } }),
            models.learning_paths.count({ where: { is_active: false } })
        ]);

        const payload = { count: active + inactive, active, inactive };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        logger.error('Error fetching Learning Paths count', { error, requestId });
        return res.status(500).json({
            success: false,
            code: "LP_COUNT_FAILED",
            requestId
        });
    }
};

// GET /api/learning-paths/:pathSlug
const getLearningPathBySlug = async (req, res) => {
    try {
        const { pathSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';
        const userId = req.user?.sub;

        const excludeFields = isAdmin ? [] : ["is_active", "created_by", "updated_by"];

        const lp = await models.learning_paths.findOne({
            where: {
                path_slug: pathSlug,
                ...(isAdmin ? {} : { is_active: true })
            },
            attributes: {
                exclude: excludeFields,
                include: [
                    [literal(`(SELECT COUNT(*) FROM service_lines sl WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'service_line_count'],
                    [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'consultant_count'],
                    [literal(`(SELECT EXISTS(SELECT 1 FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = "learning_paths".learning_path_id AND ca.user_id = ${userId ? Number(userId) : 0}))`), 'is_enrolled'],
                ]
            }
        });

        if (!lp) return res.status(404).json({
            success: false,
            code: "LP_NOT_FOUND"
        });

        return res.status(200).json({
            success: true,
            data: lp
        });
    } catch (error) {
        const requestId = req.headers['x-request-id'] || null;
        logger.error('Error fetching LP by slug', { error, requestId });

        return res.status(500).json({
            success: false,
            code: "LP_FETCH_FAILED",
            requestId
        });
    }
};

const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = validations.slugQuerySchema.parse(req.query);

        const lp = await models.learning_paths.findOne({ where: { path_slug: slug } });

        return res.status(200).json({
            success: true,
            code: lp ? "SLUG_IN_USE" : "SLUG_AVAILABLE",
            data: {
                isAvailable: !lp
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

        logger.error('Error creating Learning Path', { error });
        return res.status(500).json({
            success: false,
            code: "SLUG_CHECK_FAILED"
        });
    }
};

const createLearningPath = async (req, res) => {
    try {
        const userId = req.user.sub; // admin

        const { pathTitle, pathSlug, pathDescription, imgUrl } = validations.createLearningPathBodySchema.parse(req.body);

        const textToSlugify = pathSlug ? pathSlug : pathTitle;

        // Ensure unique slug either manual or auto
        const finalUniqueSlug = await generateUniqueSlug(models.learning_paths, 'path_slug', textToSlugify);

        let finalImgUrl = imgUrl;

        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent('learning-paths', imgUrl, finalUniqueSlug);
        }

        const newLp = await models.learning_paths.create({
            path_title: pathTitle,
            path_slug: finalUniqueSlug,
            path_description: pathDescription || null,
            img_url: finalImgUrl || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('lp:list');
        await invalidateCacheByPrefix('lp:count');
        await redis.del('lp:filter-stats');
        await sendTopicUpdate("new_data", 9);

        return res.status(201).json({
            success: true,
            code: "LP_CREATED",
            data: newLp
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error creating Learning Path', { error });
        return res.status(500).json({
            success: false,
            code: "LP_CREATE_FAILED"
        });
    }
};

const updateLearningPath = async (req, res) => {
    try {
        const userId = req.user.sub;
        // Validate
        const { pathSlug: currentSlug } = validations.pathSlugParamSchema.parse(req.params);

        // New data to update
        const {
            pathTitle,
            pathSlug: manualNewSlug, // Optional
            pathDescription,
            imgUrl,
            isActive
        } = validations.updateLearningPathBodySchema.parse(req.body);

        // Search by slug
        const lp = await models.learning_paths.findOne({ where: { path_slug: currentSlug } });
        if (!lp) {
            return res.status(404).json({
                success: false,
                code: "LP_NOT_FOUND"
            });
        }

        let finalNewSlug = lp.path_slug;

        if ((pathTitle && pathTitle !== lp.path_title) || manualNewSlug) {
            // Manual has priority
            const textToSlugify = manualNewSlug ? manualNewSlug : pathTitle;

            finalNewSlug = await generateUniqueSlug(
                models.learning_paths,
                'path_slug',
                textToSlugify,
                lp.learning_path_id,
                'learning_path_id'
            );
        }

        let finalImgUrl = imgUrl !== undefined ? imgUrl : lp.img_url;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'learning-paths',
                imgUrl,
                finalNewSlug
            );
        }

        await lp.update({
            path_title: pathTitle !== undefined ? pathTitle : lp.path_title,
            path_slug: finalNewSlug,
            path_description: pathDescription !== undefined ? pathDescription : lp.path_description,
            img_url: finalImgUrl,
            is_active: isActive !== undefined ? isActive : lp.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('lp:list');
        await invalidateCacheByPrefix('lp:count');
        await redis.del('lp:filter-stats');
        await sendTopicUpdate("new_data", 9);

        return res.status(200).json({
            success: true,
            code: "LP_UPDATED",
            data: lp
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error updating Learning Path', { error });
        return res.status(500).json({
            success: false,
            code: "LP_UPDATE_FAILED"
        });
    }
};

const deleteLearningPath = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug } = validations.pathSlugParamSchema.parse(req.params);

        const lp = await models.learning_paths.findOne({ where: { path_slug: pathSlug } });

        if (!lp) {
            return res.status(404).json({ success: false, code: "LP_NOT_FOUND" });
        }

        if (!lp.is_active) {
            return res.status(400).json({ success: false, code: "LP_ALREADY_INACTIVE" });
        }

        const [assignedLeaders, consultantsEnrolled, activeApplications] = await Promise.all([
            models.service_line_leaders.count({
                include: [{ model: models.service_lines, as: 'service_line', where: { learning_path_id: lp.learning_path_id }, required: true, attributes: [] }]
            }),
            models.consultant_areas.count({
                include: [{
                    model: models.areas, as: 'area', required: true, attributes: [],
                    include: [{ model: models.service_lines, as: 'service_line', where: { learning_path_id: lp.learning_path_id }, required: true, attributes: [] }]
                }]
            }),
            models.badge_applications.count({
                where: { application_state: ['Open', 'Submitted', 'In validation'] },
                include: [{ model: models.badges, as: 'badge', where: { learning_path_id: lp.learning_path_id }, required: true, attributes: [] }]
            })
        ]);

        if (assignedLeaders > 0 || consultantsEnrolled > 0 || activeApplications > 0) {
            return res.status(409).json({
                success: false,
                code: "LP_HAS_DEPENDENCIES",
                data: { assignedLeaders, consultantsEnrolled, activeApplications }
            });
        }

        await lp.update({ is_active: false, updated_by: userId });

        await invalidateCacheByPrefix('lp:list');
        await invalidateCacheByPrefix('lp:count');
        await redis.del('lp:filter-stats');
        await invalidateCacheByPrefix('sl:list');
        await invalidateCacheByPrefix('sl:count');
        await redis.del('sl:filter-stats');
        await invalidateCacheByPrefix('areas:list');
        await invalidateCacheByPrefix('areas:count');
        await redis.del('areas:filter-stats');
        await sendTopicUpdate("new_data", 9);

        return res.status(200).json({ success: true, code: "LP_DEACTIVATED" });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, code: "VALIDATION_INVALID_URL_PARAM" });
        }
        logger.error('Error deleting Learning Path', { error });
        return res.status(500).json({ success: false, code: "LP_DELETE_FAILED" });
    }
};

const getFilterStats = async (req, res) => {
    const cacheKey = 'lp:filter-stats';
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: JSON.parse(cached) });

        const rows = await models.learning_paths.findAll({
            attributes: [
                [literal(`(SELECT COUNT(DISTINCT ca.user_id) FROM consultant_areas ca JOIN areas a ON a.area_id = ca.area_id JOIN service_lines sl ON sl.service_line_id = a.service_line_id WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'consultant_count'],
                [literal(`(SELECT COUNT(*) FROM service_lines sl WHERE sl.learning_path_id = "learning_paths".learning_path_id)`), 'service_line_count'],
            ],
            raw: true,
        });

        const maxConsultantCount = Math.max(0, ...rows.map(r => Number(r.consultant_count || 0)));
        const maxServiceLineCount = Math.max(0, ...rows.map(r => Number(r.service_line_count || 0)));

        const payload = { maxConsultantCount, maxServiceLineCount };
        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);
        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        logger.error('Error fetching LP filter stats', { error });
        return res.status(500).json({ success: false, code: 'LP_FILTER_STATS_FAILED' });
    }
};

const reactivateLearningPath = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug } = validations.pathSlugParamSchema.parse(req.params);

        const lp = await models.learning_paths.findOne({ where: { path_slug: pathSlug } });

        if (!lp) {
            return res.status(404).json({ success: false, code: "LP_NOT_FOUND" });
        }

        if (lp.is_active) {
            return res.status(400).json({ success: false, code: "LP_ALREADY_ACTIVE" });
        }

        await lp.update({ is_active: true, updated_by: userId });

        await invalidateCacheByPrefix('lp:list');
        await invalidateCacheByPrefix('lp:count');
        await redis.del('lp:filter-stats');
        await sendTopicUpdate("new_data", 9);

        return res.status(200).json({ success: true, code: "LP_ACTIVATED" });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, code: "VALIDATION_INVALID_URL_PARAM" });
        }
        logger.error('Error reactivating Learning Path', { error });
        return res.status(500).json({ success: false, code: "LP_ACTIVATE_FAILED" });
    }
};

module.exports = {
    getAllLearningPaths,
    getFilterStats,
    getLearningPathsCount,
    getLearningPathBySlug,
    checkSlugAvailability,
    createLearningPath,
    updateLearningPath,
    deleteLearningPath,
    reactivateLearningPath,
};
