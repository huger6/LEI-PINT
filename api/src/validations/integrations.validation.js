const { z } = require('zod');
const { positiveIntIdRule } = require('./shared-rules');

const webhookBodySchema = z.object({
    platform: z.enum(['teams', 'slack'], { message: 'VALIDATION_INTEGRATION_PLATFORM_INVALID' }),
    webhook_url: z.string().trim().url('VALIDATION_INTEGRATION_URL_INVALID').startsWith('https://', 'VALIDATION_INTEGRATION_URL_HTTPS_REQUIRED'),
    channel_name: z.string().trim().max(100).optional()
});

const webhookIdParam = z.object({
    id: positiveIntIdRule
});

module.exports = {
    webhookBodySchema,
    webhookIdParam
};
