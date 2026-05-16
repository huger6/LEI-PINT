const redis = require('../config/redis');
const { logger } = require('./logger');

/**
 * Generic cached count responder for active/inactive scoped entities.
 * Reusable across controllers that need lightweight count endpoints.
 */
const handleCachedCountRequest = async ({
    req,
    res,
    model,
    cacheKey,
    where = { is_active: true },
    failureCode = 'COUNT_FETCH_FAILED',
    logContext = 'count'
}) => {
    const requestId = req.headers['x-request-id'] || null;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cached)
            });
        }

        const count = await model.count({ where });
        const payload = { count };

        await redis.set(cacheKey, JSON.stringify(payload), 'EX', 7200);

        return res.status(200).json({
            success: true,
            data: payload
        });
    } catch (error) {
        logger.error(`Error fetching ${logContext} count`, { error, requestId });
        return res.status(500).json({
            success: false,
            code: failureCode,
            requestId
        });
    }
};

module.exports = {
    handleCachedCountRequest
};
