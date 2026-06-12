const { z } = require('zod');
require('./error-map');
const filter = require('leo-profanity');
const sanitizeText = require('../utils/sanitizeText');
const formatFullName = require('../utils/formatFullName');
const loadEnvironment = require('../config/loadEnv');

loadEnvironment();

filter.addDictionary('pt', require('./dictionaries/pt.json'));
filter.addDictionary('es', require('./dictionaries/es.json'));
filter.loadDictionary('en');
filter.add(filter.getDictionary('pt'));
filter.add(filter.getDictionary('es'));

const positiveIntIdRule = z.coerce.number().int().positive('VALIDATION_IDENTIFIER_POSITIVE_INTEGER');

const uuidRule = z.string().uuid('VALIDATION_IDENTIFIER_UUID_INVALID');

const fullNameRule = z.string().trim()
    .min(2, 'VALIDATION_FULL_NAME_MIN_LENGTH')
    .max(255, 'VALIDATION_FULL_NAME_MAX_LENGTH')
    .transform(sanitizeText)
    .transform(formatFullName);

// Variant used for profile updates where we should not change user's casing
const fullNameNoFormat = z.string().trim()
    .min(2, 'Name must have a minimum of 2 characters.')
    .max(255, 'Name must have a maximum of 255 characters.')
    .transform(sanitizeText);

const usernameRule = z.string().trim()
    .min(3, 'VALIDATION_USERNAME_MIN_LENGTH')
    .max(50, 'VALIDATION_USERNAME_MAX_LENGTH')
    .regex(/^[a-zA-Z0-9._]+$/, 'VALIDATION_USERNAME_INVALID_FORMAT');

const emailRule = z.string().trim()
    .email('VALIDATION_EMAIL_INVALID_FORMAT')
    .max(255, 'VALIDATION_EMAIL_MAX_LENGTH');

const passwordRule = z.string()
    .min(8, 'VALIDATION_PASSWORD_MIN_LENGTH')
    .max(100, 'VALIDATION_PASSWORD_MAX_LENGTH')
    .regex(/[A-Z]/, 'VALIDATION_PASSWORD_MISSING_UPPERCASE')
    .regex(/[a-z]/, 'VALIDATION_PASSWORD_MISSING_LOWERCASE')
    .regex(/[0-9]/, 'VALIDATION_PASSWORD_MISSING_NUMBER')
    .regex(/[^a-zA-Z0-9]/, 'VALIDATION_PASSWORD_MISSING_SPECIAL_CHAR');

const phoneNumberRule = z.string()
    .regex(/^\+\d{7,15}$/, 'VALIDATION_PHONE_INVALID_FORMAT')
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
    }, 'VALIDATION_BIRTHDATE_MINIMUM_AGE')
);

const syncedAtRule = z.coerce.date().optional();

const imgUrlRule = z.string()
    .url('VALIDATION_URL_INVALID')
    .startsWith(
        `${process.env.SUPABASE_STORAGE_URL}/storage/v1/object/public/public-assets/temp/`,
        'VALIDATION_IMAGE_MUST_BE_IN_TEMP_STORAGE'
    );

const imgUrlExistingRule = z.string()
    .url('VALIDATION_URL_INVALID')
    .startsWith(
        `${process.env.SUPABASE_STORAGE_URL}/storage/v1/object/public/public-assets/`,
        'VALIDATION_IMAGE_MUST_BE_IN_STORAGE'
    );

const biographyRule = z.string().trim()
    .max(5000, 'VALIDATION_BIOGRAPHY_MAX_LENGTH')
    .transform(sanitizeText)
    .refine((val) => {
        const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
        return wordCount <= 500;
    }, {
        message: 'VALIDATION_BIOGRAPHY_MAX_WORDS'
    })
    .refine((val) => {
        return !filter.check(val);
    }, {
        message: 'VALIDATION_BIOGRAPHY_INAPPROPRIATE_LANGUAGE'
    });

module.exports = {
    biographyRule,
    birthdateRule,
    emailRule,
    fullNameRule,
    fullNameNoFormat,
    passwordRule,
    phoneNumberRule,
    positiveIntIdRule,
    syncedAtRule,
    uuidRule,
    imgUrlRule,
    imgUrlExistingRule,
    usernameRule
};
