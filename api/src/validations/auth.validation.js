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
    .min(1, 'You must select at least 1 area.')
    .max(5, `You can't select more than 5 areas`)
    .refine((areas) => areas.filter((area) => area.is_primary).length <= 1, {
        message: 'Only one area can be defined as primary.'
    })
    .refine((areas) => new Set(areas.map((area) => area.area_id)).size === areas.length, {
        message: `You can't select the same area more than once.`
    }
    );

const registerSchema = z.discriminatedUnion('user_role', [
    baseUserSchema.extend({
        user_role: z.literal('Consultant', `Allowed roles: 'Consultant', 'Talent Manager', 'Service Line Leader'.`),
        biography: biographyRule.optional(),
        areas: consultantAreasSchema
    }),
    baseUserSchema.extend({
        user_role: z.literal('Talent Manager', `Allowed roles: 'Consultant', 'Talent Manager', 'Service Line Leader'.`),
        biography: biographyRule.optional()
    }),
    baseUserSchema.extend({
        user_role: z.literal('Service Line Leader', `Allowed roles: 'Consultant', 'Talent Manager', 'Service Line Leader'.`),
        biography: biographyRule.optional(),
        service_line_id: positiveIntIdRule
    }),
]);

const loginSchema = z.object({
    identifier: z.union([emailRule, usernameRule], {
        errorMap: () => ({ message: "Please enter a valid email or username." })
    }),
    password: z.string().min(1, "Password is required"),
    remember: z.boolean().default(false)
});

const updateProfileSchema = z.object({
    full_name: fullNameRule.optional(),
    phone_number: phoneNumberRule.optional(),
    birthdate: birthdateRule.optional(),
    profile_img_url: imgUrlRule.optional(),
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
