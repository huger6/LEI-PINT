const { z } = require('zod');
require('./error-map');
const sanitizeText = require('../utils/sanitizeText');
const { positiveIntIdRule } = require('./shared-rules');

const dateRule = z.coerce.date();

const createGoalSchema = z.object({
    badgeId: positiveIntIdRule,
    eventTitle: z.string().trim()
        .min(1, 'VALIDATION_GOAL_TITLE_REQUIRED')
        .max(150, 'VALIDATION_GOAL_TITLE_MAX_LENGTH')
        .transform(sanitizeText),
    eventDescription: z.string().trim()
        .max(5000, 'VALIDATION_GOAL_DESCRIPTION_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable(),
    eventStartDate: dateRule.optional().nullable(),
    eventEndDate: dateRule.optional().nullable(),
    reminderAt: dateRule.optional().nullable()
}).refine(
    (d) => !(d.eventStartDate && d.eventEndDate) || d.eventEndDate >= d.eventStartDate,
    { path: ['eventEndDate'], message: 'VALIDATION_GOAL_END_BEFORE_START' }
);

const updateGoalSchema = z.object({
    eventTitle: z.string().trim()
        .min(1, 'VALIDATION_GOAL_TITLE_REQUIRED')
        .max(150, 'VALIDATION_GOAL_TITLE_MAX_LENGTH')
        .transform(sanitizeText)
        .optional(),
    eventDescription: z.string().trim()
        .max(5000, 'VALIDATION_GOAL_DESCRIPTION_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable(),
    eventStartDate: dateRule.optional().nullable(),
    eventEndDate: dateRule.optional().nullable(),
    reminderAt: dateRule.optional().nullable()
}).refine(
    (d) => !(d.eventStartDate && d.eventEndDate) || d.eventEndDate >= d.eventStartDate,
    { path: ['eventEndDate'], message: 'VALIDATION_GOAL_END_BEFORE_START' }
);

const goalIdParamSchema = z.object({
    goalId: positiveIntIdRule
});

module.exports = {
    createGoalSchema,
    updateGoalSchema,
    goalIdParamSchema
};
