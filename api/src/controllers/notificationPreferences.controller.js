const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const {
    updateGlobalPreferenceBody,
    updateUserPreferenceBody,
    preferenceIdParam,
    definitionIdParam
} = require('../validations/notifications.validation');

const listGlobalPreferences = async (req, res) => {
    try {
        const preferences = await models.notification_preferences.findAll({
            include: [{ model: models.notification_definitions, as: 'definition' }],
            order: [['preference_id', 'ASC']]
        });

        return res.status(200).json({ success: true, data: preferences });

    } catch (error) {
        logger.error('Error listing global notification preferences', { error });
        return res.status(500).json({ success: false, code: 'GLOBAL_PREFERENCES_LIST_FAILED' });
    }
};

const updateGlobalPreference = async (req, res) => {
    try {
        let validatedParams;
        try {
            validatedParams = preferenceIdParam.parse(req.params);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_ID');
            throw error;
        }

        let validatedBody;
        try {
            validatedBody = updateGlobalPreferenceBody.parse(req.body);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_BODY');
            throw error;
        }

        const preference = await models.notification_preferences.findByPk(validatedParams.preferenceId);

        if (!preference) {
            return res.status(404).json({ success: false, code: 'PREFERENCE_NOT_FOUND' });
        }

        const updateData = {
            ...validatedBody,
            updated_by: req.user.sub,
            updated_at: new Date()
        };

        await preference.update(updateData);

        return res.status(200).json({
            success: true,
            code: 'GLOBAL_PREFERENCE_UPDATED',
            data: preference
        });

    } catch (error) {
        logger.error('Error updating global notification preference', { error });
        return res.status(500).json({ success: false, code: 'GLOBAL_PREFERENCE_UPDATE_FAILED' });
    }
};

const listUserPreferences = async (req, res) => {
    try {
        const userId = req.user.sub;

        const definitions = await models.notification_definitions.findAll({
            order: [['definition_id', 'ASC']]
        });

        const globalPrefs = await models.notification_preferences.findAll();

        const userPrefs = await models.user_notification_preferences.findAll({
            where: { user_id: userId }
        });

        const globalMap = {};
        for (const gp of globalPrefs) {
            globalMap[gp.definition_id] = gp;
        }

        const userMap = {};
        for (const up of userPrefs) {
            userMap[up.definition_id] = up;
        }

        const data = definitions.map(def => {
            const global = globalMap[def.definition_id];
            const override = userMap[def.definition_id];

            const globalValues = {
                send_push: global ? global.send_push : true,
                send_email: global ? global.send_email : true,
                is_enabled: global ? global.is_enabled : true
            };

            const overrideValues = override ? {
                send_push: override.send_push,
                send_email: override.send_email,
                is_enabled: override.is_enabled
            } : null;

            const effective = { ...globalValues };
            if (override) {
                if (override.send_push !== null) effective.send_push = override.send_push;
                if (override.send_email !== null) effective.send_email = override.send_email;
                if (override.is_enabled !== null) effective.is_enabled = override.is_enabled;
            }

            return {
                definition_id: def.definition_id,
                code: def.code,
                name: def.name,
                description: def.description,
                global: globalValues,
                override: overrideValues,
                effective
            };
        });

        return res.status(200).json({ success: true, data });

    } catch (error) {
        logger.error('Error listing user notification preferences', { error });
        return res.status(500).json({ success: false, code: 'USER_PREFERENCES_LIST_FAILED' });
    }
};

const updateUserPreference = async (req, res) => {
    try {
        const userId = req.user.sub;

        let validatedParams;
        try {
            validatedParams = definitionIdParam.parse(req.params);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_ID');
            throw error;
        }

        let validatedBody;
        try {
            validatedBody = updateUserPreferenceBody.parse(req.body);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_BODY');
            throw error;
        }

        const definition = await models.notification_definitions.findByPk(validatedParams.definitionId);
        if (!definition) {
            return res.status(404).json({ success: false, code: 'DEFINITION_NOT_FOUND' });
        }

        const allNull = (validatedBody.send_push === null || validatedBody.send_push === undefined) &&
                         (validatedBody.send_email === null || validatedBody.send_email === undefined) &&
                         (validatedBody.is_enabled === null || validatedBody.is_enabled === undefined);

        if (allNull) {
            await models.user_notification_preferences.destroy({
                where: { user_id: userId, definition_id: validatedParams.definitionId }
            });

            return res.status(200).json({ success: true, code: 'USER_PREFERENCE_RESET' });
        }

        const [pref, created] = await models.user_notification_preferences.findOrCreate({
            where: { user_id: userId, definition_id: validatedParams.definitionId },
            defaults: {
                send_push: validatedBody.send_push !== undefined ? validatedBody.send_push : null,
                send_email: validatedBody.send_email !== undefined ? validatedBody.send_email : null,
                is_enabled: validatedBody.is_enabled !== undefined ? validatedBody.is_enabled : null,
                updated_at: new Date()
            }
        });

        if (!created) {
            const updateData = { updated_at: new Date() };
            if (validatedBody.send_push !== undefined) updateData.send_push = validatedBody.send_push;
            if (validatedBody.send_email !== undefined) updateData.send_email = validatedBody.send_email;
            if (validatedBody.is_enabled !== undefined) updateData.is_enabled = validatedBody.is_enabled;

            await pref.update(updateData);
        }

        return res.status(created ? 201 : 200).json({
            success: true,
            code: created ? 'USER_PREFERENCE_CREATED' : 'USER_PREFERENCE_UPDATED',
            data: pref
        });

    } catch (error) {
        logger.error('Error updating user notification preference', { error });
        return res.status(500).json({ success: false, code: 'USER_PREFERENCE_UPDATE_FAILED' });
    }
};

module.exports = {
    listGlobalPreferences,
    updateGlobalPreference,
    listUserPreferences,
    updateUserPreference
};
