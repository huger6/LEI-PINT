const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');

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
                    message: "Parent Service Line not found."
                });
            }

            // Inject the ID into the query so listHelper filters by it
            req.query.service_line_id = sl.service_line_id;
            cachePrefix = `areas:list:sl:${slSlug}`;
        }

        return handleListRequest({
            req, res,
            schema: validations.getAreasQuerySchema,
            modelName: 'areas',
            cachePrefix: cachePrefix,
            order: [['area_name', 'ASC']]
        });

    } catch (error) {
        logger.error('Error listing Areas', { error });
        return res.status(500).json({
            success: false,
            message: "Error listing Areas."
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
                message: "Area not found or does not belong to this hierarchy."
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
            message: "Error fetching Area."
        });
    }
};

const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = validations.slugQuerySchema.parse(req.query);

        const area = await models.areas.findOne({ where: { area_slug: slug } });

        return res.status(200).json({
            success: true,
            message: area ? "Slug is already in use." : "Slug is available.",
            data: {
                isAvailable: !area
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error checking Area slug', { error });
        return res.status(500).json({
            success: false,
            message: "Error checking slug."
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
                    message: "Parent Service Line not found."
                });
            }

            serviceLineId = sl.service_line_id;
        }

        if (!serviceLineId) {
            return res.status(400).json({
                success: false,
                message: "serviceLineId is required."
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

        return res.status(201).json({
            success: true,
            message: "Area created successfully.",
            data: newArea
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error creating Area', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Area not found or does not belong to this hierarchy."
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

        return res.status(200).json({
            success: true,
            message: "Area updated successfully.",
            data: area
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error updating Area', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Area not found or does not belong to this hierarchy."
            });
        }

        if (!area.is_active) {
            return res.status(400).json({
                success: false,
                message: "Area is already inactive."
            });
        }

        await area.update({
            is_active: false,
            updated_by: userId
        });

        return res.status(200).json({
            success: true,
            message: "Area deactivated successfully."
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid URL parameter."
            });
        }

        logger.error('Error deleting Area', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    getAreas,
    getAreaBySlug,
    checkSlugAvailability,
    createArea,
    updateArea,
    deleteArea
};