const { models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');

const getAvailableLocations = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const availableLocationsKey = `locations:available`;

    try {
        // Search location in redis
        const cachedData = await redis.get(availableLocationsKey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                code: "LOCATION_LIST_SUCCESS",
                data: JSON.parse(cachedData)
            });
        }

        const locations = await models.locations.findAll({
            raw: true
        });

        await redis.set(availableLocationsKey, JSON.stringify(locations), 'EX', 86400);

        res.status(200).json({
            success: true,
            code: "LOCATION_LIST_SUCCESS",
            data: locations
        });
    } catch (error) {
        logger.error('Error processing available locations.', {
            error,
            requestId
        });

        return res.status(500).json({
            success: false,
            code: "LOCATION_LIST_FAILED",
            requestId
        });
    }
};


module.exports = {
    getAvailableLocations
};
