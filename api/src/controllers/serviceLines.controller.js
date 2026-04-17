const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');

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

module.exports = { getServiceLines, getServiceLineBySlug };