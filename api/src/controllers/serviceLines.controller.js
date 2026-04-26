const { models } = require('../config/db');
const { Op } = require('sequelize');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');

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
                    message: "Parent Learning Path not found."
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
            message: "Error listing Service Lines.",
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
                message: "Service Line not found or does not belong to this path."
            });
        }

        return res.status(200).json({ success: true, data: sl });

    } catch (error) {
        logger.error('Error fetching Service Line', { error, requestId });
        return res.status(500).json({
            success: false,
            message: "Error fetching Service Line.",
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
                message: "Slug query parameter is required."
            });
        }

        const sl = await models.service_lines.findOne({ where: { sl_slug: slug } });

        return res.status(200).json({
            success: true,
            message: sl ? "Slug is already in use." : "Slug is available.",
            data: {
                isAvailable: !sl
            }
        });

    } catch (error) {
        logger.error('Error checking SL slug', { error });
        return res.status(500).json({
            success: false,
            message: "Error checking slug."
        });
    }
};

const createServiceLine = async (req, res) => {
    try {
        const userId = req.user.sub; // Admin ID

        // Extract parent pathSlug from URL to find the parent Learning Path ID
        const { pathSlug } = validations.pathSlugParamSchema.parse(req.params);

        const { serviceLineName, slSlug, serviceLineDescription, imgUrl } = validations.createServiceLineBodySchema.parse(req.body);

        // Find the parent Learning Path
        const lp = await models.learning_paths.findOne({ where: { path_slug: pathSlug } });
        if (!lp) {
            return res.status(404).json({
                success: false,
                message: "Parent Learning Path not found."
            });
        }

        // Determine and ensure unique slug
        const textToSlugify = slSlug ? slSlug : serviceLineName;
        const finalUniqueSlug = await generateUniqueSlug(models.service_lines, 'sl_slug', textToSlugify);

        // Handle Image Upload
        let finalImgUrl = imgUrl;
        if (imgUrl && imgUrl.includes('/temp/')) {
            finalImgUrl = await storageService.moveStructureImageToPermanent(
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

        return res.status(201).json({
            success: true,
            message: "Service Line created successfully.",
            data: newSl
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error creating Service Line', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Service Line not found."
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
            finalImgUrl = await storageService.moveStructureImageToPermanent(
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

        return res.status(200).json({
            success: true,
            message: "Service Line updated successfully.",
            data: sl
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error updating Service Line', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Service Line not found."
            });
        }

        if (!sl.is_active) {
            return res.status(400).json({
                success: false,
                message: "Service Line is already inactive."
            });
        }

        // Soft delete
        await sl.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('sl:list');

        return res.status(200).json({
            success: true,
            message: "Service Line deactivated successfully."
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid URL parameter."
            });
        }

        logger.error('Error deleting Service Line', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


module.exports = {
    getServiceLines,
    getServiceLineBySlug,
    checkSlugAvailability,
    createServiceLine,
    updateServiceLine,
    deleteServiceLine
};