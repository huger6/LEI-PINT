const { Op } = require('sequelize');
const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { z } = require('zod');
const { biographyRule } = require('../validations/shared-rules');

const valueQuerySchema = z.object({
    value: z.string().trim().min(1, 'Value is required.')
});

const biographyBodySchema = z.object({
    biography: biographyRule
});

const dbCheck = async (model, field, value, caseInsensitive = false) => {
    const where = caseInsensitive
        ? { [field]: { [Op.iLike]: value } }
        : { [field]: value };
    const count = await model.count({ where });
    return count === 0;
};

const handleQueryCheck = async (req, res, label, checkFn) => {
    const parsed = valueQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: parsed.error.issues[0].message
        });
    }
    const available = await checkFn(parsed.data.value);
    return res.status(200).json({ success: true, data: { available } });
};

const checkUsername = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'username', (val) =>
            dbCheck(models.users, 'username', val, true)
        );
    } catch (error) {
        logger.error('Error checking username availability', { error });
        return res.status(500).json({ success: false, message: "Error checking username availability." });
    }
};

const checkEmail = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'email', (val) =>
            dbCheck(models.users, 'email_address', val, true)
        );
    } catch (error) {
        logger.error('Error checking email availability', { error });
        return res.status(500).json({ success: false, message: "Error checking email availability." });
    }
};

const checkAreaSlug = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'area slug', (val) =>
            dbCheck(models.areas, 'area_slug', val)
        );
    } catch (error) {
        logger.error('Error checking area slug availability', { error });
        return res.status(500).json({ success: false, message: "Error checking area slug availability." });
    }
};

const checkServiceLineSlug = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'service line slug', (val) =>
            dbCheck(models.service_lines, 'sl_slug', val)
        );
    } catch (error) {
        logger.error('Error checking service line slug availability', { error });
        return res.status(500).json({ success: false, message: "Error checking service line slug availability." });
    }
};

const checkLearningPathSlug = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'learning path slug', (val) =>
            dbCheck(models.learning_paths, 'path_slug', val)
        );
    } catch (error) {
        logger.error('Error checking learning path slug availability', { error });
        return res.status(500).json({ success: false, message: "Error checking learning path slug availability." });
    }
};

const checkBadgeSlug = async (req, res) => {
    try {
        return await handleQueryCheck(req, res, 'badge slug', (val) =>
            dbCheck(models.badges, 'badge_slug', val)
        );
    } catch (error) {
        logger.error('Error checking badge slug availability', { error });
        return res.status(500).json({ success: false, message: "Error checking badge slug availability." });
    }
};

const checkBiography = async (req, res) => {
    try {
        const parsed = biographyBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(200).json({
                success: true,
                data: {
                    available: false,
                    errors: parsed.error.issues.map(e => e.message)
                }
            });
        }
        return res.status(200).json({ success: true, data: { available: true } });
    } catch (error) {
        logger.error('Error checking biography', { error });
        return res.status(500).json({ success: false, message: "Error checking biography." });
    }
};

module.exports = {
    checkUsername,
    checkEmail,
    checkAreaSlug,
    checkServiceLineSlug,
    checkLearningPathSlug,
    checkBadgeSlug,
    checkBiography
};
