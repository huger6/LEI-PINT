const { z } = require('zod');
require('./error-map');
const { positiveIntIdRule, syncedAtRule, imgUrlRule, imgUrlExistingRule } = require('./shared-rules');
const sanitizeText = require('../utils/sanitizeText');

const optionalSearchRule = z
	.string()
	.max(255, 'VALIDATION_SEARCH_QUERY_MAX_LENGTH')
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
	is_active: booleanQueryRule.optional(),
	synced_at: syncedAtRule,
	page: z.coerce.number().int().positive('VALIDATION_PAGE_POSITIVE_INTEGER').default(1),
	limit: z.coerce.number().int().positive('VALIDATION_LIMIT_POSITIVE_INTEGER').max(100, 'VALIDATION_LIMIT_MAX_100').default(32)
});

const getServiceLinesQuerySchema = z.object({
	learningPathId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	is_active: booleanQueryRule.optional(),
	synced_at: syncedAtRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(32)
});

const getAreasQuerySchema = z.object({
	serviceLineId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	is_active: booleanQueryRule.optional(),
	synced_at: syncedAtRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(32)
});

const getLevelsQuerySchema = z.object({
	areaId: positiveIntIdRule.optional(),
	search: optionalSearchRule,
	is_active: booleanQueryRule.optional(),
	synced_at: syncedAtRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(32)
});

const getBadgesQuerySchema = z.object({
	areaId: positiveIntIdRule.optional(),
	progressionStageId: positiveIntIdRule.optional(),
	serviceLineId: positiveIntIdRule.optional(),
	learningPathId: positiveIntIdRule.optional(),
	synced_at: syncedAtRule,
	stageCodes: z.preprocess((value) => {
		if (value === undefined || value === null || value === '') {
			return undefined;
		}

		if (Array.isArray(value)) {
			return value
				.flatMap((item) => String(item).split(','))
				.map((item) => item.trim())
				.filter(Boolean);
		}

		if (typeof value === 'string') {
			return value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);
		}

		return value;
	}, z.array(z.string().trim().min(1).max(20)).max(5)).optional(),
	badgeClass: z.enum(['all', 'standard', 'special']).optional(),
	minPoints: z.coerce.number().int().min(0).optional(),
	maxPoints: z.coerce.number().int().min(0).optional(),
	expiringOnly: booleanQueryRule.optional(),
	obtained: z.enum(['all', 'true', 'false']).optional(),
	search: optionalSearchRule,
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(32)
}).refine(
	({ minPoints, maxPoints }) => {
		if (minPoints === undefined || maxPoints === undefined) {
			return true;
		}

		return minPoints <= maxPoints;
	},
	{
		message: 'VALIDATION_POINTS_RANGE_INVALID',
		path: ['maxPoints']
	}
);

// Path parameter schemas
const pathSlugParamSchema = z.object({
	pathSlug: z.string().trim().min(1, 'VALIDATION_LEARNING_PATH_SLUG_REQUIRED').max(500, 'VALIDATION_SLUG_MAX_500')
});

const slSlugParamSchema = z.object({
	slSlug: z.string().trim().min(1, 'VALIDATION_SERVICE_LINE_SLUG_REQUIRED').max(500, 'VALIDATION_SLUG_MAX_500')
});

// Request body schemas
const createLearningPathBodySchema = z.object({
	pathTitle: z.string().trim().min(2).max(150),

	pathSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, 'VALIDATION_SLUG_INVALID_FORMAT')
		.optional()
		.nullable(),

	pathDescription: z.string().trim().max(5000).optional().nullable(),
	imgUrl: imgUrlRule.optional().nullable()
});

const updateLearningPathBodySchema = createLearningPathBodySchema.extend({
	isActive: z.boolean().optional(),
	imgUrl: imgUrlExistingRule.optional().nullable()
}).partial();

const createServiceLineBodySchema = z.object({
	learningPathId: positiveIntIdRule.optional(),

	serviceLineName: z.string().trim().min(2).max(100),

	slSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, 'VALIDATION_SLUG_INVALID_FORMAT')
		.optional()
		.nullable(),

	serviceLineDescription: z.string().trim().max(5000).optional().nullable(),

	imgUrl: imgUrlRule.optional().nullable()
});

const updateServiceLineBodySchema = createServiceLineBodySchema.extend({
	isActive: z.boolean().optional(),
	imgUrl: imgUrlExistingRule.optional().nullable()
}).partial();

// --- Areas ---
const areaSlugParamSchema = z.object({
	areaSlug: z.string().trim().min(1, 'VALIDATION_AREA_SLUG_REQUIRED').max(500, 'VALIDATION_SLUG_MAX_500')
});

const createAreaBodySchema = z.object({
	serviceLineId: positiveIntIdRule.optional(),

	areaName: z.string().trim().min(2).max(100),

	areaSlug: z.string().trim()
		.max(150)
		.regex(/^[a-z0-9\-]+$/, 'VALIDATION_SLUG_INVALID_FORMAT')
		.optional()
		.nullable(),

	areaCode: z.string().trim().max(20).optional().nullable(),

	areaDescription: z.string().trim().max(5000).optional().nullable(),

	imgUrl: imgUrlRule.optional().nullable()
});

const updateAreaBodySchema = createAreaBodySchema.extend({
	isActive: z.boolean().optional(),
	imgUrl: imgUrlExistingRule.optional().nullable()
}).partial();

// --- Levels (Progression Stages) ---
const stageCodeParamSchema = z.object({
	stageCode: z.string().trim().min(1, 'VALIDATION_STAGE_CODE_REQUIRED').max(20, 'VALIDATION_STAGE_CODE_MAX_LENGTH')
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
	badgeSlug: z.string().trim().min(1, 'VALIDATION_BADGE_SLUG_REQUIRED').max(100, 'VALIDATION_BADGE_SLUG_MAX_100')
});

const createBadgeBodySchema = z.object({
	progressionStageId: positiveIntIdRule.optional(),

	badgeTitle: z.string().trim().min(2).max(100),

	badgeSlug: z.string().trim()
		.max(100)
		.regex(/^[a-z0-9\-]+$/, 'VALIDATION_SLUG_INVALID_FORMAT')
		.optional()
		.nullable(),

	badgeType: z.string().trim().min(1).max(128),

	badgePoints: z.coerce.number().int().min(0).default(0),

	expirationDurationDays: z.coerce.number().int().positive().optional().nullable(),

	badgeDescription: z.string().trim().max(5000).optional().nullable(),

	badgeImgUrl: imgUrlRule.optional().nullable()
});

const updateBadgeBodySchema = createBadgeBodySchema.extend({
	isActive: z.boolean().optional(),
	badgeImgUrl: imgUrlExistingRule.optional().nullable()
}).partial();

const slugQuerySchema = z.object({
	slug: z.string().trim().min(1, 'VALIDATION_SLUG_REQUIRED').max(500, 'VALIDATION_SLUG_MAX_500')
});

// --- Badge Requirements ---
const requirementIdParamSchema = z.object({
	requirementId: positiveIntIdRule
});

const getRequirementsQuerySchema = z.object({
	synced_at: syncedAtRule,
	is_active: booleanQueryRule.optional()
});

const createRequirementBodySchema = z.object({
	requirementTitle: z.string().trim().min(2, 'VALIDATION_REQUIREMENT_TITLE_MIN').max(150, 'VALIDATION_REQUIREMENT_TITLE_MAX'),

	requirementDescription: z.string().trim().min(1, 'VALIDATION_REQUIREMENT_DESCRIPTION_REQUIRED').max(5000, 'VALIDATION_REQUIREMENT_DESCRIPTION_MAX'),

	requirementSequence: z.coerce.number().int().positive().optional().nullable(),

	badgePoints: z.coerce.number().int().min(0).default(0)
});

const updateRequirementBodySchema = createRequirementBodySchema.extend({
	isActive: z.boolean().optional()
}).partial();

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
	updateBadgeBodySchema,
	requirementIdParamSchema,
	getRequirementsQuerySchema,
	createRequirementBodySchema,
	updateRequirementBodySchema
};
