const { models } = require('../config/db');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');

// GET /api/learning-paths
const getAllLearningPaths = (req, res) => {
    return handleListRequest({
        req, res,
        schema: validations.getAvailableLearningPathsQuerySchema,
        modelName: 'learning_paths',
        cachePrefix: 'lp:list',
        order: [['path_title', 'ASC']]
    });
};

// GET /api/learning-paths/:pathSlug
const getLearningPathBySlug = async (req, res) => {
    try {
        const { pathSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        // Hide unimportant data for non admins
        const excludeFields = isAdmin ? [] : ["is_active", "created_by", "updated_by"];

        const lp = await models.learning_paths.findOne({
            where: {
                path_slug: pathSlug,
                ...(isAdmin ? {} : { is_active: true })
            },
            attributes: {
                exclude: excludeFields
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

        await lp.update({
            path_title: pathTitle !== undefined ? pathTitle : lp.path_title,
            path_slug: finalNewSlug,
            path_description: pathDescription !== undefined ? pathDescription : lp.path_description,
            img_url: imgUrl !== undefined ? imgUrl : lp.img_url,
            is_active: isActive !== undefined ? isActive : lp.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('lp:list');

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

        // Search by slug
        const lp = await models.learning_paths.findOne({ where: { path_slug: pathSlug } });

        if (!lp) {
            return res.status(404).json({
                success: false,
                code: "LP_NOT_FOUND"
            });
        }

        if (!lp.is_active) {
            return res.status(400).json({
                success: false,
                code: "LP_ALREADY_INACTIVE"
            });
        }

        await lp.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('lp:list');

        return res.status(200).json({
            success: true,
            code: "LP_DEACTIVATED"
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_URL_PARAM"
            });
        }

        logger.error('Error deleting Learning Path', { error });
        return res.status(500).json({
            success: false,
            code: "LP_DELETE_FAILED"
        });
    }
};

module.exports = {
    getAllLearningPaths,
    getLearningPathBySlug,
    checkSlugAvailability,
    createLearningPath,
    updateLearningPath,
    deleteLearningPath
};
