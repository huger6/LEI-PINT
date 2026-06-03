const { z } = require('zod');
require('./error-map');
const { positiveIntIdRule } = require('./shared-rules');

const dateRule = z.preprocess(
    (arg) => {
        if (arg === null || arg === undefined || arg === '') return undefined;
        return typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg;
    },
    z.date({ invalid_type_error: 'VALIDATION_DATE_INVALID' })
);

const booleanQueryRule = z.preprocess(
    (v) => typeof v === 'string' ? v.trim().toLowerCase() : v,
    z.union([z.literal('true'), z.literal('false'), z.boolean()]).optional()
).transform((v) => v === undefined ? undefined : (typeof v === 'boolean' ? v : v === 'true'));

const getSLAsQuerySchema = z.object({
    isActive: booleanQueryRule,
    isGlobal: booleanQueryRule,
    targetProfile: z.string().trim().max(128).optional(),
    search: z.string().trim().max(255).optional().transform((v) => (v === '' ? undefined : v)),
    page: z.coerce.number().int().positive('VALIDATION_PAGE_POSITIVE_INTEGER').default(1),
    limit: z.coerce.number().int().positive('VALIDATION_LIMIT_POSITIVE_INTEGER').max(100, 'VALIDATION_LIMIT_MAX_100').default(12)
});

const slaIdParamSchema = z.object({
    slaId: z.coerce.number().int().positive('VALIDATION_IDENTIFIER_POSITIVE_INTEGER')
});

const createSLABodySchema = z.object({
    slaName: z.string().trim()
        .min(2, 'VALIDATION_SLA_NAME_MIN_LENGTH')
        .max(100, 'VALIDATION_SLA_NAME_MAX_LENGTH'),

    responseTimeHours: z.coerce.number().int().positive('VALIDATION_RESPONSE_TIME_POSITIVE'),

    startDate: dateRule,
    endDate: dateRule,

    targetProfile: z.string().trim().max(128).optional().nullable(),
    isGlobal: z.boolean().optional().nullable(),
    slaDescription: z.string().trim().max(10000).optional().nullable(),

    definitionId: positiveIntIdRule.optional().nullable(),
    userId: positiveIntIdRule.optional().nullable()
}).refine(
    (data) => data.endDate > data.startDate,
    { message: 'VALIDATION_END_DATE_AFTER_START_DATE', path: ['endDate'] }
);

const updateSLABodySchema = z.object({
    slaName: z.string().trim()
        .min(2, 'VALIDATION_SLA_NAME_MIN_LENGTH')
        .max(100, 'VALIDATION_SLA_NAME_MAX_LENGTH')
        .optional(),

    responseTimeHours: z.coerce.number().int().positive('VALIDATION_RESPONSE_TIME_POSITIVE').optional(),

    startDate: z.preprocess(
        (arg) => {
            if (arg === null || arg === undefined || arg === '') return undefined;
            return typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg;
        },
        z.date({ invalid_type_error: 'VALIDATION_DATE_INVALID' }).optional()
    ),
    endDate: z.preprocess(
        (arg) => {
            if (arg === null || arg === undefined || arg === '') return undefined;
            return typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg;
        },
        z.date({ invalid_type_error: 'VALIDATION_DATE_INVALID' }).optional()
    ),

    targetProfile: z.string().trim().max(128).optional().nullable(),
    isGlobal: z.boolean().optional().nullable(),
    isActive: z.boolean().optional(),
    slaDescription: z.string().trim().max(10000).optional().nullable(),

    definitionId: positiveIntIdRule.optional().nullable(),
    userId: positiveIntIdRule.optional().nullable()
}).refine(
    (data) => {
        if (data.startDate && data.endDate) return data.endDate > data.startDate;
        return true;
    },
    { message: 'VALIDATION_END_DATE_AFTER_START_DATE', path: ['endDate'] }
);

module.exports = {
    getSLAsQuerySchema,
    slaIdParamSchema,
    createSLABodySchema,
    updateSLABodySchema
};
