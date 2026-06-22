const { z } = require('zod');

const SUPPORTED_TARGETS = ['en', 'es'];
const MAX_TEXTS = 100;
const MAX_TEXT_LENGTH = 5000;

const translateSchema = z.object({
    texts: z.array(
        z.string().trim().min(1, 'VALIDATION_TRANSLATION_TEXT_EMPTY').max(MAX_TEXT_LENGTH, 'VALIDATION_TRANSLATION_TEXT_TOO_LONG')
    ).min(1, 'VALIDATION_TRANSLATION_TEXTS_REQUIRED').max(MAX_TEXTS, 'VALIDATION_TRANSLATION_TOO_MANY_TEXTS'),
    target: z.string().trim().refine((val) => SUPPORTED_TARGETS.includes(val), {
        message: 'VALIDATION_TRANSLATION_UNSUPPORTED_TARGET'
    })
});

module.exports = { translateSchema };
