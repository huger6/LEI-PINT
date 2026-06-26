const { z } = require('zod');

const rewardGuidParamSchema = z.object({
    rewardGuid: z.string().uuid()
});

const rewardBodySchema = z.object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().max(2000).optional().nullable(),
    accessLink: z.string().trim().url().max(2000).optional().nullable(),
    accessInfo: z.string().trim().max(2000).optional().nullable(),
    imgUrl: z.string().trim().url().max(2000).optional().nullable(),
    costPoints: z.coerce.number().int().min(0),
    isActive: z.boolean().optional(),
    category: z.enum(['course', 'voucher', 'title', 'physical', 'subscription']).optional().nullable()
});

module.exports = {
    rewardGuidParamSchema,
    rewardBodySchema
};
