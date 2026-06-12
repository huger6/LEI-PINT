const { z } = require('zod');
const { positiveIntIdRule } = require('./shared-rules');

const dateRule = z.coerce.date();

const pointsHistoryQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

const userIdParamSchema = z.object({
    userId: positiveIntIdRule
});

const peerComparisonQuerySchema = z.object({
    userId: positiveIntIdRule.optional(),
    tolerance: z.coerce.number().min(0).max(1).default(0.25)
});

const applicationsCountQuerySchema = z.object({
    serviceLineId: positiveIntIdRule.optional()
});

const badgeDistributionQuerySchema = z.object({
    groupBy: z.enum(['learning_path', 'service_line', 'area']).default('learning_path'),
    dateFrom: dateRule.optional(),
    dateTo: dateRule.optional()
}).refine(
    (data) => !(data.dateFrom && data.dateTo) || data.dateFrom <= data.dateTo,
    { message: 'dateFrom must be before or equal to dateTo', path: ['dateFrom'] }
);

const badgesByRangeQuerySchema = z.object({
    dateFrom: dateRule,
    dateTo: dateRule,
    learningPathId: positiveIntIdRule.optional(),
    serviceLineId: positiveIntIdRule.optional(),
    areaId: positiveIntIdRule.optional(),
    stageId: positiveIntIdRule.optional()
}).refine(
    (data) => data.dateFrom <= data.dateTo,
    { message: 'dateFrom must be before or equal to dateTo', path: ['dateFrom'] }
);

module.exports = {
    pointsHistoryQuerySchema,
    userIdParamSchema,
    peerComparisonQuerySchema,
    applicationsCountQuerySchema,
    badgeDistributionQuerySchema,
    badgesByRangeQuerySchema
};
