const { models } = require('../config/db');
const redis = require('../config/redis');

const getAvailableLanguages = async (req, res) => {
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
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error processing available languages."
        });
    }
};


module.exports = {
    getAvailableLanguages
}