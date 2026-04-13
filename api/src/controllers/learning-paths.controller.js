const { Op } = require('sequelize');
const { models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const { getAvailableLearningPathsQuerySchema } = require('../validations/learning-paths.validation');

const getAvailableLearningPaths = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    const queryValidation = getAvailableLearningPathsQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
        return res.status(400).json({
            success: false,
            message: 'Error validating data.',
            errors: queryValidation.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }

    const {
        search,
        serviceLineId,
        isAdmin,
        page,
        limit
    } = queryValidation.data;

    // Offset
    const offset = (page - 1) * limit;

    const filtersSnapshot = JSON.stringify({ search, serviceLineId, isAdmin, page, limit });
    const cacheKey = `learning-paths:available:${Buffer.from(filtersSnapshot).toString('base64')}`;

    try {
        // Search lps in redis
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Learning Paths acquired successfully.",
                ...JSON.parse(cachedData)
            });
        }

        // Filters
        const where = {};
        const include = [];

        if (!isAdmin) {
            where.is_active = true;
        }

        if (search) {
            const searchPattern = `%${search}%`;
            where[Op.or] = [
                { path_title: { [Op.iLike]: searchPattern } },
                { path_description: { [Op.iLike]: searchPattern } }
            ];
        }

        // Reverse search (get LPs by service line)
        if (serviceLineId) {
            include.push({
                model: models.services_lines,
                as: 'services_lines',
                attributes: [],
                where: {
                    service_line_id: serviceLineId
                },
                required: true
            });
        }

        const { rows, count } = await models.learning_paths.findAndCountAll({
            attributes: [
                'learning_path_id',
                'path_title',
                'path_slug',
                'path_description',
                'img_url',
                'is_active'
            ],
            where,
            include,
            order: [['path_title', 'ASC']],
            limit,
            offset,
            distinct: true,
            col: 'learning_path_id',
            subQuery: false
        });

        const lps = rows.map((learningPath) => learningPath.get({ plain: true }));
        const totalItems = typeof count === 'number' ? count : count.length;
        const totalPages = Math.ceil(totalItems / limit);

        const responseData = {
            data: lps,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };

        // Store in redis for 2 hours
        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 7200);

        res.status(200).json({
            success: true,
            message: "Learning paths acquired successfully.",
            ...responseData
        });
    } catch (error) {
        logger.error('Error processing available learning paths.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error processing available learning paths."
        });
    }
};


module.exports = {
    getAvailableLearningPaths
}