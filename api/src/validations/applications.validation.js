const { z } = require('zod');
require('./error-map');
const sanitizeText = require('../utils/sanitizeText');
const { positiveIntIdRule, uuidRule } = require('./shared-rules');

const startApplicationSchema = z.object({
    badgeId: positiveIntIdRule
});

const applicationGuidParamSchema = z.object({
    applicationGuid: z.string().uuid('VALIDATION_APPLICATION_GUID_INVALID')
});

const upsertEvidenceBodySchema = z.object({
    requirementId: positiveIntIdRule,

    evidenceFileUrl: z.string().trim()
        .url('VALIDATION_EVIDENCE_URL_INVALID')
        .max(500, 'VALIDATION_EVIDENCE_URL_MAX_LENGTH'),

    evidenceTitle: z.string().trim()
        .min(1, 'VALIDATION_EVIDENCE_TITLE_REQUIRED')
        .max(150, 'VALIDATION_EVIDENCE_TITLE_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable(),

    evidenceDescription: z.string().trim()
        .max(5000, 'VALIDATION_EVIDENCE_DESCRIPTION_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable(),

    evidenceFileType: z.string().trim()
        .max(100, 'VALIDATION_EVIDENCE_FILE_TYPE_MAX_LENGTH')
        .optional()
        .nullable()
});

const getApplicationsQuerySchema = z.object({
    state: z.preprocess(
        (val) => (typeof val === 'string' ? [val] : val),
        z.array(z.enum(['Open', 'Submitted', 'In validation', 'Accepted', 'Rejected']))
    )
        .optional()
        .describe("Filter applications by one or multiple states"),

    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20)
});

const getUploadUrlBodySchema = z.object({
    requirementId: positiveIntIdRule, // Usa a tua regra base para IDs

    fileName: z.string().trim()
        .min(1, 'VALIDATION_UPLOAD_FILE_NAME_REQUIRED')
        .max(255, 'VALIDATION_UPLOAD_FILE_NAME_MAX_LENGTH')
        // Esta regex garante que o ficheiro tem uma extensão (ex: .pdf, .png)
        // Essencial porque o teu backend faz: fileName.split('.').pop()
        .regex(/\.[0-9a-z]+$/i, 'VALIDATION_UPLOAD_FILE_EXTENSION_INVALID')
});

const reviewApplicationSchema = z.object({
    action: z.enum(['accept', 'reject', 'review'], {
        errorMap: () => ({ message: 'VALIDATION_REVIEW_ACTION_INVALID' })
    }),
    reviewerNotes: z.string().trim()
        .max(2000, 'VALIDATION_REVIEWER_NOTES_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable()
});

const reviewEvidenceSchema = z.object({
    approved: z.boolean({ required_error: 'VALIDATION_EVIDENCE_APPROVED_REQUIRED' }),
    reviewNotes: z.string().trim()
        .max(1000, 'VALIDATION_EVIDENCE_REVIEW_NOTES_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable()
});

const evidenceIdParamSchema = z.object({
    applicationGuid: uuidRule,
    evidenceId: positiveIntIdRule
});

module.exports = {
    startApplicationSchema,
    applicationGuidParamSchema,
    upsertEvidenceBodySchema,
    getApplicationsQuerySchema,
    getUploadUrlBodySchema,
    reviewApplicationSchema,
    reviewEvidenceSchema,
    evidenceIdParamSchema
};
