const { z } = require('zod');
const sanitizeText = require('../utils/sanitizeText');
const { positiveIntIdRule } = require('./shared-rules');

const startApplicationSchema = z.object({
    badgeId: positiveIntIdRule,
    goalId: positiveIntIdRule.optional().nullable()
});

const applicationIdParamSchema = z.object({
    applicationId: positiveIntIdRule
});

const upsertEvidenceBodySchema = z.object({
    requirementId: positiveIntIdRule,

    evidenceFileUrl: z.string().trim()
        .url('Invalid URL format.')
        .max(500, 'URL cannot exceed 500 characters.'),

    evidenceTitle: z.string().trim()
        .min(1, 'Title cannot be empty.')
        .max(150, 'Title cannot exceed 150 characters.')
        .transform(sanitizeText)
        .optional()
        .nullable(),

    evidenceDescription: z.string().trim()
        .max(5000, 'Description is technically too long.')
        .transform(sanitizeText)
        .optional()
        .nullable(),

    evidenceFileType: z.string().trim()
        .max(100, 'File type cannot exceed 100 characters.')
        .optional()
        .nullable()
});

const getApplicationsQuerySchema = z.object({
    state: z.preprocess(
        (val) => (typeof val === 'string' ? [val] : val),
        z.array(z.enum(['Open', 'Submitted', 'In validation', 'Accepted', 'Rejected']))
    )
        .optional()
        .describe("Filter applications by one or multiple states"),

    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20)
});

module.exports = {
    startApplicationSchema,
    applicationIdParamSchema,
    upsertEvidenceBodySchema,
    getApplicationsQuerySchema
};