const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');

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
            message: "Learning Path not found."
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
            message: "Internal server error.",
            requestId
        });
    }
};

module.exports = {
    getAllLearningPaths,
    getLearningPathBySlug
};