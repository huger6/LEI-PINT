const { z } = require('zod');

const issueCodeToValidationCode = {
    [z.ZodIssueCode.invalid_type]: 'VALIDATION_INVALID_TYPE',
    [z.ZodIssueCode.invalid_literal]: 'VALIDATION_INVALID_LITERAL',
    [z.ZodIssueCode.unrecognized_keys]: 'VALIDATION_UNRECOGNIZED_KEYS',
    [z.ZodIssueCode.invalid_union]: 'VALIDATION_INVALID_UNION',
    [z.ZodIssueCode.invalid_union_discriminator]: 'VALIDATION_INVALID_UNION_DISCRIMINATOR',
    [z.ZodIssueCode.invalid_enum_value]: 'VALIDATION_INVALID_ENUM_VALUE',
    [z.ZodIssueCode.invalid_arguments]: 'VALIDATION_INVALID_ARGUMENTS',
    [z.ZodIssueCode.invalid_return_type]: 'VALIDATION_INVALID_RETURN_TYPE',
    [z.ZodIssueCode.invalid_date]: 'VALIDATION_INVALID_DATE',
    [z.ZodIssueCode.invalid_string]: 'VALIDATION_INVALID_STRING',
    [z.ZodIssueCode.too_small]: 'VALIDATION_VALUE_TOO_SMALL',
    [z.ZodIssueCode.too_big]: 'VALIDATION_VALUE_TOO_BIG',
    [z.ZodIssueCode.custom]: 'VALIDATION_CUSTOM_RULE_FAILED',
    [z.ZodIssueCode.invalid_intersection_types]: 'VALIDATION_INVALID_INTERSECTION_TYPES',
    [z.ZodIssueCode.not_multiple_of]: 'VALIDATION_NOT_MULTIPLE_OF',
    [z.ZodIssueCode.not_finite]: 'VALIDATION_NOT_FINITE'
};

z.setErrorMap((issue, ctx) => {
    if (issue.message) {
        return { message: issue.message };
    }

    const code = issueCodeToValidationCode[issue.code] || 'VALIDATION_GENERIC_ERROR';
    return { message: code || ctx.defaultError };
});

