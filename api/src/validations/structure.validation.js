const { z } = require('zod');
const { positiveIntIdRule, imgUrlRule } = require('./shared-rules');
const sanitizeText = require('../utils/sanitizeText');

const optionalSearchRule = z
	.string()
	.max(255, 'Search query is too long.')
	.optional()
	.transform((value) => {
		if (value === undefined) return undefined;
		const trimmed = value.trim();
		return trimmed === '' ? undefined : sanitizeText(trimmed);
	});

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
	learningPathId: positiveIntIdRule.optional(),

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

// --- Areas ---
const areaSlugParamSchema = z.object({
	areaSlug: z.string().trim().min(1, "Area slug is required.").max(500, "Slug's maximum length is 500.")
});

const createAreaBodySchema = z.object({
	serviceLineId: positiveIntIdRule.optional(),

	areaName: z.string().trim().min(2).max(100),

	areaSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
		.optional()
		.nullable(),

	areaCode: z.string().trim().max(20).optional().nullable(),

	areaDescription: z.string().trim().max(5000).optional().nullable(),

	imgUrl: imgUrlRule.optional().nullable()
});

const updateAreaBodySchema = createAreaBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

// --- Levels (Progression Stages) ---
const stageCodeParamSchema = z.object({
	stageCode: z.string().trim().min(1, "Stage code is required.").max(20, "Stage code maximum length is 20.")
});

const createLevelBodySchema = z.object({
	areaId: positiveIntIdRule.optional(),

	stageCode: z.string().trim().min(1).max(20),

	stageTitle: z.string().trim().min(2).max(100),

	stageSequence: z.coerce.number().int().positive().optional().nullable(),

	stageDescription: z.string().trim().max(5000).optional().nullable()
});

const updateLevelBodySchema = createLevelBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

// --- Badges ---
const badgeSlugParamSchema = z.object({
	badgeSlug: z.string().trim().min(1, "Badge slug is required.").max(100, "Slug's maximum length is 100.")
});

const createBadgeBodySchema = z.object({
	progressionStageId: positiveIntIdRule.optional(),
	goalId: positiveIntIdRule.optional().nullable(),

	badgeTitle: z.string().trim().min(2).max(100),

	badgeSlug: z.string().trim()
		.max(100)
		.regex(/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
		.optional()
		.nullable(),

	badgeType: z.string().trim().min(1).max(128),

	badgePoints: z.coerce.number().int().min(0).default(0),

	expirationDurationDays: z.coerce.number().int().positive().optional().nullable(),

	estimatedTimeToAcquire: z.string().trim()
		.regex(/^\d{2}:\d{2}(:\d{2})?$/, "Estimated time must be in HH:MM or HH:MM:SS format.")
		.optional()
		.nullable(),

	badgeDescription: z.string().trim().max(5000).optional().nullable(),

	badgeImgUrl: imgUrlRule.optional().nullable()
});

const updateBadgeBodySchema = createBadgeBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

const slugQuerySchema = z.object({
	slug: z.string().trim().min(1, "Slug is required.").max(500)
});

module.exports = {
	// Query schemas
	getAvailableLearningPathsQuerySchema,
	getServiceLinesQuerySchema,
	getAreasQuerySchema,
	getLevelsQuerySchema,
	getBadgesQuerySchema,
	slugQuerySchema,

	// Path parameter schemas
	pathSlugParamSchema,
	slSlugParamSchema,
	areaSlugParamSchema,
	stageCodeParamSchema,
	badgeSlugParamSchema,

	// Request body schemas
	createLearningPathBodySchema,
	updateLearningPathBodySchema,
	createServiceLineBodySchema,
	updateServiceLineBodySchema,
	createAreaBodySchema,
	updateAreaBodySchema,
	createLevelBodySchema,
	updateLevelBodySchema,
	createBadgeBodySchema,
	updateBadgeBodySchema
};