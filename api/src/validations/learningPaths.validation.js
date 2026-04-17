const { z } = require('zod');
const { positiveIntIdRule } = require('./shared-rules');
const sanitizeText = require('../utils/sanitizeHtml');

const optionalSearchRule = z.preprocess(
	(value) => {
		if (typeof value !== 'string') {
			return value;
		}

		const trimmed = value.trim();
		return trimmed === '' ? undefined : trimmed;
	},
	z.string()
		.max(255, 'Search query is too long.')
		.transform(sanitizeText)
		.optional()
);

const booleanQueryRule = z.preprocess(
	(value) => {
		if (typeof value === 'string') {
			return value.trim().toLowerCase();
		}

		return value;
	},
	z.union([z.literal('true'), z.literal('false'), z.boolean()])
).transform((value) => (typeof value === 'boolean' ? value : value === 'true'));

const getAvailableLearningPathsQuerySchema = z.object({
	search: optionalSearchRule,
	serviceLineId: positiveIntIdRule.optional(),
	page: z.coerce.number().int().positive('Page must be a positive integer.').default(1),
	limit: z.coerce.number().int().positive('Limit must be a positive integer.').max(100, 'Limit cannot exceed 100.').default(12)
});

const getServiceLinesQuerySchema = z.object({
	learningPathId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(12)
});

const getAreasQuerySchema = z.object({
	serviceLineId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(12)
});

const getLevelsQuerySchema = z.object({
	areaId: positiveIntIdRule.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20)
});

module.exports = {
	getAvailableLearningPathsQuerySchema,
	getServiceLinesQuerySchema,
	getAreasQuerySchema,
	getLevelsQuerySchema
};