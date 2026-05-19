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

const shareBadgeSchema = z.object({
    badgeId: z.coerce.number().int().positive()
});

module.exports = {
    trackInteractionSchema,
    getInteractionsQuerySchema,
    getPointsHistoryQuerySchema,
    getRecommendationsQuerySchema,
    shareBadgeSchema
};
