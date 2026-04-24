const { z } = require('zod');
const {
    biographyRule,
    birthdateRule,
    emailRule,
    fullNameRule,
    passwordRule,
    phoneNumberRule,
    positiveIntIdRule,
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
    .min(1, 'You must select at least 1 area.')
    .max(5, "You can't select more than 5 areas.")
    .refine((areas) => areas.filter((area) => area.is_primary).length === 1, {
        message: 'Exactly one area must be defined as primary.'
    })
    .refine((areas) => new Set(areas.map((area) => area.area_id)).size === areas.length, {
        message: "You can't select the same area more than once."
    });

const userIdParamSchema = z.object({
    userId: positiveIntIdRule
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
    preferred_lang_id: positiveIntIdRule.default(1),
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
    preferred_lang_id: positiveIntIdRule.optional(),
    location_id: positiveIntIdRule.optional(),
    user_role: userRoleRule.optional(),
    biography: biographyRule.optional(),
    areas: consultantAreasSchema.optional(),
    service_line_id: positiveIntIdRule.optional(),
    approve_member: z.boolean().optional()
})
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: 'At least one field must be provided.' }
    )
    .superRefine((data, ctx) => {
        if (data.user_role === 'Consultant' && !data.areas) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['areas'],
                message: 'Consultant users must include at least one area with one primary area.'
            });
        }

        if (data.user_role === 'Service Line Leader' && !data.service_line_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['service_line_id'],
                message: 'Service Line Leader users must include service_line_id.'
            });
        }

        if (data.user_role && data.user_role !== 'Consultant' && data.areas) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['areas'],
                message: 'areas can only be sent for Consultant users.'
            });
        }

        if (data.user_role && data.user_role !== 'Service Line Leader' && data.service_line_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['service_line_id'],
                message: 'service_line_id can only be sent for Service Line Leader users.'
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
