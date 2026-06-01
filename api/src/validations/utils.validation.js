const { z } = require('zod');
const { biographyRule } = require('./shared-rules');

const valueQuerySchema = z.object({
    value: z.string().trim().min(1, 'VALIDATION_QUERY_VALUE_REQUIRED')
});

const biographyBodySchema = z.object({
    biography: biographyRule
});

module.exports = {
    valueQuerySchema,
    biographyBodySchema
};
