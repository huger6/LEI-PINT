const { models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');

const getAvailableLanguages = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const availableLanguagesKey = `languages:available`;

    try {
        // Search language in redis
        const cachedData = await redis.get(availableLanguagesKey);

        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Languages acquired successfully.",
                data: JSON.parse(cachedData)
            });
        }

        const languages = await models.preferred_lang.findAll({
            raw: true
        });

        await redis.set(availableLanguagesKey, JSON.stringify(languages), 'EX', 86400);

        res.status(200).json({
            success: true,
            message: "Languages acquired successfully.",
            data: languages
        });
    } catch (error) {
        logger.error('Error processing available languages.', {
            error,
            requestId
        });

        return res.status(500).json({
            success: false,
            message: "Error processing available languages.",
            requestId
        });
    }
};


module.exports = {
    getAvailableLanguages
};