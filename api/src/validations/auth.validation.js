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
    imgUrlRule,
    usernameRule
} = require('./shared-rules');

const baseUserSchema = z.object({
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

const consultantAreasSchema = z.array(z.object({
    area_id: positiveIntIdRule,
    is_primary: z.boolean()
}))
    .min(1, 'VALIDATION_AREAS_MIN_SELECTION')
    .max(5, 'VALIDATION_AREAS_MAX_SELECTION')
    .refine((areas) => areas.filter((area) => area.is_primary).length <= 1, {
        message: 'VALIDATION_AREAS_MAX_ONE_PRIMARY'
    })
    .refine((areas) => new Set(areas.map((area) => area.area_id)).size === areas.length, {
        message: 'VALIDATION_AREAS_DUPLICATED'
    }
    );

const registerSchema = z.discriminatedUnion('user_role', [
    baseUserSchema.extend({
        user_role: z.literal('Consultant', 'VALIDATION_AUTH_USER_ROLE_INVALID'),
        biography: biographyRule.optional(),
        areas: consultantAreasSchema
    }),
    baseUserSchema.extend({
        user_role: z.literal('Talent Manager', 'VALIDATION_AUTH_USER_ROLE_INVALID'),
        biography: biographyRule.optional()
    }),
    baseUserSchema.extend({
        user_role: z.literal('Service Line Leader', 'VALIDATION_AUTH_USER_ROLE_INVALID'),
        biography: biographyRule.optional(),
        service_line_id: positiveIntIdRule
    }),
]);

const loginSchema = z.object({
    identifier: z.union([emailRule, usernameRule], {
        errorMap: () => ({ message: 'VALIDATION_LOGIN_IDENTIFIER_INVALID' })
    }),
    password: z.string().min(1, 'VALIDATION_LOGIN_PASSWORD_REQUIRED'),
    remember: z.boolean().default(false)
});

const { fullNameNoFormat } = require('./shared-rules');

const updateProfileSchema = z.object({
    full_name: fullNameNoFormat.optional(),
    phone_number: phoneNumberRule.optional(),
    birthdate: birthdateRule.optional(),
    profile_img_url: z.union([imgUrlRule, z.null()]).optional(),
    language_id: positiveIntIdRule.optional(),
    location_id: positiveIntIdRule.optional(),
    biography: biographyRule.optional()
});

module.exports = {
    emailRule,
    passwordRule,
    baseUserSchema,
    registerSchema,
    loginSchema,
    updateProfileSchema,
};
