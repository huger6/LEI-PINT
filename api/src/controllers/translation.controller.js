const { ZodError } = require('zod');
const { translateSchema } = require('../validations/translation.validation');
const { translateTexts } = require('../services/translation.service');
const { handleZodError } = require('../utils/responseHelper');
const { logger } = require('../utils/logger');

const translate = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    try {
        const { texts, target } = translateSchema.parse(req.body);

        const translations = await translateTexts(texts, target);

        return res.status(200).json({
            success: true,
            code: 'TRANSLATION_SUCCESS',
            data: { translations }
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return handleZodError(res, error, 'TRANSLATION_VALIDATION_FAILED');
        }

        logger.error('Translation request failed', { error, requestId });

        return res.status(500).json({
            success: false,
            code: 'TRANSLATION_FAILED',
            requestId
        });
    }
};

module.exports = { translate };
