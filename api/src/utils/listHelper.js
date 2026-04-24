const { Op } = require('sequelize');
const { models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('./logger');

const handleListRequest = async ({
    req,
    res,
    schema,
    modelName,
    cachePrefix,
    baseWhere = {},
    include = [],
    order = [['created_at', 'DESC']],
    attributes = null
}) => {
    const requestId = req.headers['x-request-id'] || null;
    const isAdmin = req.user?.role === 'Administrator';

    const queryValidation = schema.safeParse(req.query);
    if (!queryValidation.success) return res.status(400).json({
        success: false,
        errors: queryValidation.error.errors
    });

    const { page, limit, search, ...filters } = queryValidation.data;
    const offset = (page - 1) * limit;

    const cacheKey = `${cachePrefix}:${Buffer.from(JSON.stringify({ ...filters, search, isAdmin, page, limit })).toString('base64')}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.status(200).json({
            success: true,
            ...JSON.parse(cached)
        });

        const where = { ...baseWhere };

        const tablesWhithoutIsActive = ['locations'];
        if (!isAdmin && !tablesWhithoutIsActive.includes(modelName))
            where.is_active = true;

        Object.keys(filters).forEach(key => {
            const value = filters[key];
            if (value !== undefined && value !== null && value !== '') {
                where[key] = value;
            }
        });

        if (search) {
            const searchFields = {
                'progression_stages': 'stage_title',
                'service_lines': 'service_line_name',
                'learning_paths': 'path_title',
                'areas': 'area_name'
            };

            const nameField = searchFields[modelName] || 'area_name';

            where[nameField] = { [Op.iLike]: `%${search}%` };
        }

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];
        const finalAttributes = attributes || {
            exclude: excludedFields
        };

        const { rows, count } = await models[modelName].findAndCountAll({
            where, include, limit, offset, order, distinct: true,
            attributes: finalAttributes
        });

        const totalPages = Math.ceil(count / limit);

        // Block if page does not exist
        if (page > totalPages && count > 0) {
            return res.status(404).json({
                success: false,
                message: "Page not found."
            });
        }

        const responseData = {
            data: rows,
            pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page }
        };

        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 7200);
        return res.status(200).json({
            success: true,
            ...responseData
        });
    } catch (error) {
        logger.error(`Error in ${cachePrefix}`, { requestId, error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    handleListRequest
};
