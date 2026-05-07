const { z } = require('zod');
require('./error-map');

const INTERACTION_TYPES = ['VIEW', 'SHARE_LINKEDIN', 'FAVORITE'];

const trackInteractionSchema = z.object({
    badgeId: z.coerce.number().int().positive(),
    interactionType: z.enum(INTERACTION_TYPES)
});

const getInteractionsQuerySchema = z.object({
    badgeId: z.coerce.number().int().positive().optional(),
    type: z.enum(INTERACTION_TYPES).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

const getPointsHistoryQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

const getRecommendationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(12)
});

// Applications – review an application (TM / SLL / Admin)
const reviewApplicationSchema = z.object({
    action: z.enum(['accept', 'reject', 'review']),
    reviewerNotes: z.string().max(2000).optional()
});

// Applications – review a single evidence (TM / SLL)
const reviewEvidenceSchema = z.object({
    approved: z.boolean(),
    reviewNotes: z.string().max(1000).optional()
});

const applicationGuidParamSchema = z.object({
    applicationGuid: z.string().uuid()
});

const evidenceIdParamSchema = z.object({
    applicationGuid: z.string().uuid(),
    evidenceId: z.coerce.number().int().positive()
});

module.exports = {
    trackInteractionSchema,
    getInteractionsQuerySchema,
    getPointsHistoryQuerySchema,
    getRecommendationsQuerySchema,
    reviewApplicationSchema,
    reviewEvidenceSchema,
    applicationGuidParamSchema,
    evidenceIdParamSchema
};
