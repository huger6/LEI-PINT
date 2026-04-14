const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/learning-paths.validation');

/**
 * Handles BOTH:
 * GET /api/areas
 * GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas
 */
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
                    as: 'learning_path', // Adjust alias based on your DB associations
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

        const area = await models.areas.findOne({
            where: whereClause,
            include: includeBlock
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

module.exports = { 
    getAreas, 
    getAreaBySlug 
};