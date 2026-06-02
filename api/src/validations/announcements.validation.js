const { z } = require('zod');
require('./error-map');
const { positiveIntIdRule } = require('./shared-rules');

const optionalDateRule = z.preprocess(
    (arg) => {
        if (arg === null || arg === undefined || arg === '') return undefined;
        return typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg;
    },
    z.date({ invalid_type_error: 'VALIDATION_DATE_INVALID' }).optional()
);

const booleanQueryRule = z.preprocess(
    (v) => typeof v === 'string' ? v.trim().toLowerCase() : v,
    z.union([z.literal('true'), z.literal('false'), z.boolean()]).optional()
).transform((v) => v === undefined ? undefined : (typeof v === 'boolean' ? v : v === 'true'));

const getAnnouncementsQuerySchema = z.object({
    isActive: booleanQueryRule,
    isGlobal: booleanQueryRule,
    targetProfile: z.string().trim().max(128).optional(),
    announcementType: z.string().trim().max(128).optional(),
    search: z.string().trim().max(255).optional().transform((v) => (v === '' ? undefined : v)),
    page: z.coerce.number().int().positive('VALIDATION_PAGE_POSITIVE_INTEGER').default(1),
    limit: z.coerce.number().int().positive('VALIDATION_LIMIT_POSITIVE_INTEGER').max(100, 'VALIDATION_LIMIT_MAX_100').default(12)
});

const announcementIdParamSchema = z.object({
    announcementId: z.coerce.number().int().positive('VALIDATION_IDENTIFIER_POSITIVE_INTEGER')
});

const createAnnouncementBodySchema = z.object({
    announcementTitle: z.string().trim()
        .min(2, 'VALIDATION_ANNOUNCEMENT_TITLE_MIN_LENGTH')
        .max(150, 'VALIDATION_ANNOUNCEMENT_TITLE_MAX_LENGTH'),

    announcementMessage: z.string().trim()
        .min(1, 'VALIDATION_ANNOUNCEMENT_MESSAGE_REQUIRED')
        .max(10000, 'VALIDATION_ANNOUNCEMENT_MESSAGE_MAX_LENGTH'),

    startsAt: optionalDateRule,
    endsAt: optionalDateRule,

    announcementType: z.string().trim().max(128).optional().nullable(),
    targetProfile: z.string().trim().max(128).optional().nullable(),
    isGlobal: z.boolean().optional().nullable(),

    userId: positiveIntIdRule.optional().nullable()
}).refine(
    (data) => {
        if (data.startsAt && data.endsAt) return data.endsAt > data.startsAt;
        return true;
    },
    { message: 'VALIDATION_ENDS_AT_AFTER_STARTS_AT', path: ['endsAt'] }
);

const updateAnnouncementBodySchema = z.object({
    announcementTitle: z.string().trim()
        .min(2, 'VALIDATION_ANNOUNCEMENT_TITLE_MIN_LENGTH')
        .max(150, 'VALIDATION_ANNOUNCEMENT_TITLE_MAX_LENGTH')
        .optional(),

    announcementMessage: z.string().trim()
        .min(1, 'VALIDATION_ANNOUNCEMENT_MESSAGE_REQUIRED')
        .max(10000, 'VALIDATION_ANNOUNCEMENT_MESSAGE_MAX_LENGTH')
        .optional(),

    startsAt: optionalDateRule,
    endsAt: optionalDateRule,

    announcementType: z.string().trim().max(128).optional().nullable(),
    targetProfile: z.string().trim().max(128).optional().nullable(),
    isGlobal: z.boolean().optional().nullable(),
    isActive: z.boolean().optional(),

    userId: positiveIntIdRule.optional().nullable()
}).refine(
    (data) => {
        if (data.startsAt && data.endsAt) return data.endsAt > data.startsAt;
        return true;
    },
    { message: 'VALIDATION_ENDS_AT_AFTER_STARTS_AT', path: ['endsAt'] }
);

module.exports = {
    getAnnouncementsQuerySchema,
    announcementIdParamSchema,
    createAnnouncementBodySchema,
    updateAnnouncementBodySchema
};
