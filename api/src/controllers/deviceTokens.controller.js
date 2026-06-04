const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const { registerDeviceTokenBody, unregisterDeviceTokenBody } = require('../validations/notifications.validation');

const registerToken = async (req, res) => {
    try {
        const userId = req.user.sub;

        let validated;
        try {
            validated = registerDeviceTokenBody.parse(req.body);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_BODY');
            throw error;
        }

        const existing = await models.device_tokens.findOne({
            where: { fcm_token: validated.fcm_token }
        });

        if (existing) {
            await existing.update({
                user_id: userId,
                device_name: validated.device_name || existing.device_name,
                platform: validated.platform,
                is_active: true,
                last_used_at: new Date()
            });

            return res.status(200).json({
                success: true,
                code: 'DEVICE_TOKEN_UPDATED',
                data: { device_token_id: existing.device_token_id }
            });
        }

        const token = await models.device_tokens.create({
            user_id: userId,
            fcm_token: validated.fcm_token,
            device_name: validated.device_name || null,
            platform: validated.platform
        });

        return res.status(201).json({
            success: true,
            code: 'DEVICE_TOKEN_REGISTERED',
            data: { device_token_id: token.device_token_id }
        });

    } catch (error) {
        logger.error('Error registering device token', { error });
        return res.status(500).json({ success: false, code: 'DEVICE_TOKEN_REGISTER_FAILED' });
    }
};

const unregisterToken = async (req, res) => {
    try {
        const userId = req.user.sub;

        let validated;
        try {
            validated = unregisterDeviceTokenBody.parse(req.body);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_BODY');
            throw error;
        }

        const [updatedCount] = await models.device_tokens.update(
            { is_active: false },
            { where: { user_id: userId, fcm_token: validated.fcm_token, is_active: true } }
        );

        if (updatedCount === 0) {
            return res.status(404).json({ success: false, code: 'DEVICE_TOKEN_NOT_FOUND' });
        }

        return res.status(200).json({ success: true, code: 'DEVICE_TOKEN_UNREGISTERED' });

    } catch (error) {
        logger.error('Error unregistering device token', { error });
        return res.status(500).json({ success: false, code: 'DEVICE_TOKEN_UNREGISTER_FAILED' });
    }
};

const listTokens = async (req, res) => {
    try {
        const userId = req.user.sub;

        const tokens = await models.device_tokens.findAll({
            where: { user_id: userId, is_active: true },
            attributes: ['device_token_id', 'device_name', 'platform', 'created_at', 'last_used_at'],
            order: [['last_used_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: tokens });

    } catch (error) {
        logger.error('Error listing device tokens', { error });
        return res.status(500).json({ success: false, code: 'DEVICE_TOKENS_LIST_FAILED' });
    }
};

module.exports = {
    registerToken,
    unregisterToken,
    listTokens
};
