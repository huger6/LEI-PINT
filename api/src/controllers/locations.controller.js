const { models } = require('../config/db');
const redis = require('../config/redis');

const getAvailableLocations = async (req, res) => {
    const availableLocationsKey = `locations:available`;

    try {
        // Search location in redis
        const cachedData = await redis.get(availableLocationsKey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Locations acquired successfully.",
                data: JSON.parse(cachedData)
            });
        }

        const locations = await models.locations.findAll({
            raw: true
        });

        await redis.set(availableLocationsKey, JSON.stringify(locations), 'EX', 86400);

        res.status(200).json({
            success: true,
            message: "Locations acquired successfully.",
            data: locations
        });
    } catch (error) {
        logger.error('Error processing available locations.', {
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error processing available locations."
        });
    }
};


module.exports = {
    getAvailableLocations
};