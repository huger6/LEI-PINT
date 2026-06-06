const { z } = require('zod');
require('./error-map');
const { positiveIntIdRule } = require('./shared-rules');

const rankingQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20),

    learningPathId: positiveIntIdRule.optional(),
    serviceLineId: positiveIntIdRule.optional(),
    areaId: positiveIntIdRule.optional()
});

const myPositionQuerySchema = z.object({
    limit: z.coerce.number().int().positive().default(10),

    learningPathId: positiveIntIdRule.optional(),
    serviceLineId: positiveIntIdRule.optional(),
    areaId: positiveIntIdRule.optional()
});

module.exports = {
    rankingQuerySchema,
    myPositionQuerySchema
};
