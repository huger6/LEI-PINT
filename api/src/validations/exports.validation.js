const { z } = require('zod');

const exportFormatSchema = z.enum(['csv', 'xlsx', 'pdf']).default('csv');
const applicationStateSchema = z.enum(['Open', 'Submitted', 'In validation', 'Accepted', 'Rejected']);

const exportDateSchema = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'VALIDATION_EXPORT_DATE_INVALID'
});

const exportQuerySchema = z.object({
    format: exportFormatSchema.optional(),
    from: exportDateSchema.optional(),
    to: exportDateSchema.optional()
}).refine((data) => {
    if (data.from && data.to) {
        return Date.parse(data.from) <= Date.parse(data.to);
    }

    return true;
}, {
    message: 'VALIDATION_EXPORT_DATE_RANGE_INVALID',
    path: ['to']
});

const exportApplicationsQuerySchema = exportQuerySchema.extend({
    state: z.preprocess(
        (value) => (typeof value === 'string' ? [value] : value),
        z.array(applicationStateSchema)
    ).optional()
});

const exportBadgesQuerySchema = exportQuerySchema.extend({
    q: z.string().trim().min(1).max(100).optional(),
    active: z.coerce.boolean().optional()
});

module.exports = {
    exportApplicationsQuerySchema,
    exportBadgesQuerySchema,
    exportQuerySchema
};
