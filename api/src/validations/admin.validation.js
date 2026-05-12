const { z } = require('zod');
require('./error-map');
const {
    biographyRule,
    birthdateRule,
    emailRule,
    fullNameRule,
    passwordRule,
    phoneNumberRule,
    positiveIntIdRule,
    uuidRule,
    imgUrlRule,
    usernameRule
} = require('./shared-rules');

const userRoleRule = z.enum(['Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator']);

const booleanQueryRule = z.preprocess(
    (value) => {
        if (typeof value === 'string') {
            return value.trim().toLowerCase();
        }

        return value;
    },
    z.union([z.literal('true'), z.literal('false'), z.boolean()])
).transform((value) => (typeof value === 'boolean' ? value : value === 'true'));

const consultantAreasSchema = z.array(z.object({
    area_id: positiveIntIdRule,
    is_primary: z.boolean()
}))
    .min(1, 'VALIDATION_AREAS_MIN_SELECTION')
    .max(5, 'VALIDATION_AREAS_MAX_SELECTION')
    .refine((areas) => areas.filter((area) => area.is_primary).length === 1, {
        message: 'VALIDATION_AREAS_PRIMARY_REQUIRED_EXACTLY_ONE'
    })
    .refine((areas) => new Set(areas.map((area) => area.area_id)).size === areas.length, {
        message: 'VALIDATION_AREAS_DUPLICATED'
    });

const userIdParamSchema = z.object({
    // Accept either a UUID or a numeric ID (tests send numeric user_id)
    userGuid: z.string().min(1)
});

const listUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    user_role: userRoleRule.optional(),
    role: userRoleRule.optional(),
    location_id: positiveIntIdRule.optional(),
    locationId: positiveIntIdRule.optional(),
    is_active: booleanQueryRule.optional(),
    isActive: booleanQueryRule.optional()
}).transform((data) => ({
    page: data.page,
    limit: data.limit,
    user_role: data.user_role ?? data.role,
    location_id: data.location_id ?? data.locationId,
    is_active: data.is_active ?? data.isActive
}));

const baseUserDataSchema = z.object({
    full_name: fullNameRule,
    username: usernameRule,
    email_address: emailRule,
    password: passwordRule,
    phone_number: phoneNumberRule.optional(),
    birthdate: birthdateRule.optional(),
    profile_img_url: imgUrlRule.optional(),
    language_id: positiveIntIdRule.default(1),
    location_id: positiveIntIdRule.optional()
});

const createUserBodySchema = z.discriminatedUnion('user_role', [
    baseUserDataSchema.extend({
        user_role: z.literal('Consultant'),
        biography: biographyRule.optional(),
        areas: consultantAreasSchema
    }),
    baseUserDataSchema.extend({
        user_role: z.literal('Talent Manager'),
        biography: biographyRule.optional()
    }),
    baseUserDataSchema.extend({
        user_role: z.literal('Service Line Leader'),
        biography: biographyRule.optional(),
        service_line_id: positiveIntIdRule
    }),
    baseUserDataSchema.extend({
        user_role: z.literal('Administrator'),
        is_super_admin: z.boolean().optional()
    })
]);

const updateUserBodySchema = z.object({
    full_name: fullNameRule.optional(),
    username: usernameRule.optional(),
    email_address: emailRule.optional(),
    phone_number: phoneNumberRule.optional(),
    birthdate: birthdateRule.optional(),
    profile_img_url: imgUrlRule.optional(),
    language_id: positiveIntIdRule.optional(),
    location_id: positiveIntIdRule.optional(),
    user_role: userRoleRule.optional(),
    biography: biographyRule.optional(),
    areas: consultantAreasSchema.optional(),
    service_line_id: positiveIntIdRule.optional(),
    approve_member: z.boolean().optional()
})
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: 'VALIDATION_UPDATE_AT_LEAST_ONE_FIELD_REQUIRED' }
    )
    .superRefine((data, ctx) => {
        if (data.user_role === 'Consultant' && !data.areas) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['areas'],
                message: 'VALIDATION_CONSULTANT_AREAS_REQUIRED'
            });
        }

        if (data.user_role === 'Service Line Leader' && !data.service_line_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['service_line_id'],
                message: 'VALIDATION_SLL_SERVICE_LINE_REQUIRED'
            });
        }

        if (data.user_role && data.user_role !== 'Consultant' && data.areas) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['areas'],
                message: 'VALIDATION_AREAS_ONLY_FOR_CONSULTANT'
            });
        }

        if (data.user_role && data.user_role !== 'Service Line Leader' && data.service_line_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['service_line_id'],
                message: 'VALIDATION_SERVICE_LINE_ONLY_FOR_SLL'
            });
        }
    });

module.exports = {
    listUsersQuerySchema,
    createUserBodySchema,
    updateUserBodySchema,
    userIdParamSchema,
    userRoleRule
};

