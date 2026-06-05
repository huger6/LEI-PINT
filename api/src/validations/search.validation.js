const { z } = require('zod');
const sanitizeText = require('../utils/sanitizeText');

const searchEntityTypes = ['user', 'badge', 'learning_path', 'service_line', 'area', 'skill', 'language', 'location'];

const entityTypesRule = z.any().optional().transform((value) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const values = Array.isArray(value)
        ? value.flatMap((item) => String(item).split(','))
        : typeof value === 'string'
            ? value.split(',')
            : [String(value)];

    return values.map((item) => item.trim()).filter(Boolean);
}).refine((value) => value === undefined || value.every((item) => searchEntityTypes.includes(item)), {
    message: 'VALIDATION_SEARCH_ENTITY_TYPES_INVALID'
}).refine((value) => value === undefined || value.length <= 8, {
    message: 'VALIDATION_SEARCH_ENTITY_TYPES_MAX_9'
});

const searchQuerySchema = z.object({
    q: z.string().trim().min(1, 'VALIDATION_SEARCH_QUERY_REQUIRED').max(100, 'VALIDATION_SEARCH_QUERY_MAX_LENGTH').transform((value) => sanitizeText(value)),
    entityTypes: entityTypesRule,
    page: z.coerce.number().int().positive('VALIDATION_PAGE_POSITIVE_INTEGER').default(1),
    limit: z.coerce.number().int().positive('VALIDATION_LIMIT_POSITIVE_INTEGER').max(50, 'VALIDATION_LIMIT_MAX_50').default(10)
});

module.exports = {
    searchEntityTypes,
    searchQuerySchema
};