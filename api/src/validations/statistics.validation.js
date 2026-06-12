const { z } = require('zod');
require('./error-map');
const { positiveIntIdRule, uuidRule } = require('./shared-rules');

const dateRule = z.coerce.date();

const pointsHistoryQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100).optional(),
    serviceLineId: positiveIntIdRule.optional(),
    areaId: positiveIntIdRule.optional(),
    dateFrom: dateRule.optional(),
    dateTo: dateRule.optional()
});

const userIdParamSchema = z.object({
    userGuid: uuidRule
});

const peerComparisonQuerySchema = z.object({
    userGuid: uuidRule.optional(),
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
    { message: 'VALIDATION_DATE_RANGE_INVALID', path: ['dateFrom'] }
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
    { message: 'VALIDATION_DATE_RANGE_INVALID', path: ['dateFrom'] }
);

const expiringBadgesQuerySchema = z.object({
    withinDays: z.coerce.number().int().positive().max(1825).default(90)
});

const badgesSummaryQuerySchema = z.object({
    serviceLineId: z.coerce.number().int().positive().optional(),
    areaId: z.coerce.number().int().positive().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
});

const consultantsOverviewQuerySchema = z.object({
    search: z.string().trim().max(120).optional(),
    serviceLineId: z.coerce.number().int().positive().optional(),
    areaId: z.coerce.number().int().positive().optional(),
    pointsMin: z.coerce.number().int().min(0).optional(),
    pointsMax: z.coerce.number().int().min(0).optional(),
    sort: z.enum(['points_desc', 'points_asc', 'name', 'last_login']).default('points_desc'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(12)
});

module.exports = {
    pointsHistoryQuerySchema,
    userIdParamSchema,
    peerComparisonQuerySchema,
    applicationsCountQuerySchema,
    badgeDistributionQuerySchema,
    badgesByRangeQuerySchema,
    expiringBadgesQuerySchema,
    consultantsOverviewQuerySchema,
    badgesSummaryQuerySchema
};
