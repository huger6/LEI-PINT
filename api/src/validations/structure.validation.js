const { z } = require('zod');
const { positiveIntIdRule, imgUrlRule } = require('./shared-rules');
const sanitizeText = require('../utils/sanitizeText');

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

// Query schemas
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

const getBadgesQuerySchema = z.object({
	areaId: positiveIntIdRule.optional(),
	progressionStageId: positiveIntIdRule.optional(),
	serviceLineId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20)
});

// Path parameter schemas
const pathSlugParamSchema = z.object({
	pathSlug: z.string().trim().min(1, "Learning Path slug is required.").max(500, "Slug's maximum length is 500.")
});

const slSlugParamSchema = z.object({
	slSlug: z.string().trim().min(1, "Service Line slug is required.").max(500, "Slug's maximum length is 500.")
});

// Request body schemas
const createLearningPathBodySchema = z.object({
	pathTitle: z.string().trim().min(2).max(150),

	pathSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
		.optional()
		.nullable(),

	pathDescription: z.string().trim().max(5000).optional().nullable(),
	imgUrl: imgUrlRule.optional()
});

const updateLearningPathBodySchema = createLearningPathBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

const createServiceLineBodySchema = z.object({
	serviceLineName: z.string().trim().min(2).max(100),

	slSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
		.optional()
		.nullable(),

	serviceLineDescription: z.string().trim().max(5000).optional().nullable(),

	imgUrl: imgUrlRule.optional().nullable()
});

const updateServiceLineBodySchema = createServiceLineBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

module.exports = {
	// Query schemas
	getAvailableLearningPathsQuerySchema,
	getServiceLinesQuerySchema,
	getAreasQuerySchema,
	getLevelsQuerySchema,
	getBadgesQuerySchema,

	// Path parameter schemas
	pathSlugParamSchema,
	slSlugParamSchema,

	// Request body schemas
	createLearningPathBodySchema,
	updateLearningPathBodySchema,
	createServiceLineBodySchema,
	updateServiceLineBodySchema
};