const { z } = require('zod');
const filter = require('leo-profanity');
const sanitizeText = require('../utils/sanitizeText');
const loadEnvironment = require('../config/loadEnv');

loadEnvironment();

filter.addDictionary('pt', require('./dictionaries/pt.json'));
filter.addDictionary('es', require('./dictionaries/es.json'));
filter.loadDictionary('en');
filter.add(filter.getDictionary('pt'));
filter.add(filter.getDictionary('es'));

const positiveIntIdRule = z.coerce.number().int().positive("Identifier must be a positive integer.");

const uuidRule = z.string().uuid('Identifier must be a valid UUID.');

const fullNameRule = z.string().trim()
    .min(2, 'Name must have a minimum of 2 characters.')
    .max(255, 'Name must have a maximum of 255 characters.')
    .transform(sanitizeText);

const usernameRule = z.string().trim()
    .min(3, 'Username must have a minimum of 3 characters.')
    .max(50, 'Username must have a maximum of 50 characters.')
    .regex(/^[a-zA-Z0-9._]+$/, 'Username can only contain letters, numbers, dots and underscores.');

const emailRule = z.string().trim()
    .email('Invalid e-mail format.')
    .max(255, 'E-mail is too long.');

const passwordRule = z.string()
    .min(8, 'Password must have a minimum of 8 characters.')
    .max(100, 'Password must have a maximum of 100 characters.')
    .regex(/[A-Z]/, 'Password must have at least 1 capital letter.')
    .regex(/[a-z]/, 'Password must have at least 1 lowercase letter.')
    .regex(/[0-9]/, 'Password must have at least 1 number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must have at least 1 special character (!@#$%^&*)');

const phoneNumberRule = z.string()
    .regex(/^\+\d{7,15}$/, 'Invalid format. Use the international standart (must include prefix).')
    .transform(val => val.replace(/\s+/g, ''));

const birthdateRule = z.preprocess(
    (arg) => (typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg),
    z.date().refine((date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDelta = today.getMonth() - date.getMonth();

        if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
            return age - 1 >= 16;
        }

        return age >= 16;
    }, 'You must be at least 16 years old to register.')
);

const imgUrlRule = z.string()
    .url('Invalid URL format')
    .startsWith(
        `${process.env.SUPABASE_STORAGE_URL}/storage/v1/object/public/public-assets/temp/`,
        "The image must be uploaded to the temporary storage first"
    );

const biographyRule = z.string().trim()
    .max(5000, "Biography is technically too long")
    .transform(sanitizeText)
    .refine((val) => {
        const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
        return wordCount <= 500;
    }, {
        message: "Biography cannot exceed 500 words"
    })
    .refine((val) => {
        return !filter.check(val);
    }, {
        message: "Biography contains inappropriate language"
    });

module.exports = {
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
};