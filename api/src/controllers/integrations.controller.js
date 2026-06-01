const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const { webhookBodySchema, webhookIdParam } = require('../validations/integrations.validation');
const { sendTeamsNotification, sendSlackNotification } = require('../services/integrations.service');

const listWebhooks = async (req, res) => {
    try {
        const webhooks = await models.integration_webhooks.findAll({
            attributes: ['webhook_id', 'platform', 'channel_name', 'is_active', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: webhooks });
    } catch (error) {
        logger.error('Error listing webhooks', { error });
        return res.status(500).json({ success: false, code: 'INTEGRATIONS_LIST_FAILED' });
    }
};

const createWebhook = async (req, res) => {
    try {
        let validated;
        try { validated = webhookBodySchema.parse(req.body); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const webhook = await models.integration_webhooks.create({
            ...validated,
            is_active: true,
            created_by: req.user.sub
        });

        return res.status(201).json({
            success: true,
            data: {
                webhook_id: webhook.webhook_id,
                platform: webhook.platform,
                channel_name: webhook.channel_name,
                is_active: webhook.is_active
            }
        });
    } catch (error) {
        logger.error('Error creating webhook', { error });
        return res.status(500).json({ success: false, code: 'INTEGRATIONS_CREATE_FAILED' });
    }
};

const deleteWebhook = async (req, res) => {
    try {
        let validated;
        try { validated = webhookIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const webhook = await models.integration_webhooks.findByPk(validated.id);
        if (!webhook) {
            return res.status(404).json({ success: false, code: 'INTEGRATION_WEBHOOK_NOT_FOUND' });
        }

        await webhook.destroy();
        return res.status(200).json({ success: true, code: 'INTEGRATION_WEBHOOK_DELETED' });
    } catch (error) {
        logger.error('Error deleting webhook', { error });
        return res.status(500).json({ success: false, code: 'INTEGRATIONS_DELETE_FAILED' });
    }
};

const toggleWebhook = async (req, res) => {
    try {
        let validated;
        try { validated = webhookIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const webhook = await models.integration_webhooks.findByPk(validated.id);
        if (!webhook) {
            return res.status(404).json({ success: false, code: 'INTEGRATION_WEBHOOK_NOT_FOUND' });
        }

        await webhook.update({ is_active: !webhook.is_active });
        return res.status(200).json({ success: true, data: { is_active: webhook.is_active } });
    } catch (error) {
        logger.error('Error toggling webhook', { error });
        return res.status(500).json({ success: false, code: 'INTEGRATIONS_TOGGLE_FAILED' });
    }
};

const testWebhook = async (req, res) => {
    try {
        let validated;
        try { validated = webhookIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const webhook = await models.integration_webhooks.findByPk(validated.id);
        if (!webhook) {
            return res.status(404).json({ success: false, code: 'INTEGRATION_WEBHOOK_NOT_FOUND' });
        }

        const testPayload = {
            title: 'Test Notification',
            body: 'This is a test message from the Badge Management System.',
            badgeImageUrl: null,
            verificationUrl: null
        };

        let success;
        if (webhook.platform === 'teams') {
            success = await sendTeamsNotification(webhook.webhook_url, testPayload);
        } else {
            success = await sendSlackNotification(webhook.webhook_url, testPayload);
        }

        if (success) {
            return res.status(200).json({ success: true, code: 'INTEGRATION_TEST_SENT' });
        }
        return res.status(502).json({ success: false, code: 'INTEGRATION_TEST_FAILED' });
    } catch (error) {
        logger.error('Error testing webhook', { error });
        return res.status(500).json({ success: false, code: 'INTEGRATIONS_TEST_FAILED' });
    }
};

module.exports = {
    listWebhooks,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
    testWebhook
};
