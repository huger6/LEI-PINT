const { z } = require('zod');
require('./error-map');
const sanitizeText = require('../utils/sanitizeText');
const { positiveIntIdRule, uuidRule } = require('./shared-rules');

const startApplicationSchema = z.object({
    badgeSlug: z.string().trim()
        .min(1, 'VALIDATION_BADGE_SLUG_REQUIRED')
        .max(100, 'VALIDATION_BADGE_SLUG_MAX_100')
});

const applicationGuidParamSchema = z.object({
    applicationGuid: z.string().uuid('VALIDATION_APPLICATION_GUID_INVALID')
});

const submitApplicationSchema = z.object({
    consultantNotes: z.string().trim()
        .max(2000, 'VALIDATION_CONSULTANT_NOTES_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable()
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

    areaId: z.coerce.number().int().positive().optional(),
    badgeId: z.coerce.number().int().positive().optional(),
    consultantGuid: z.string().uuid().optional()
        .describe("Restrict the list to a single consultant (by user_guid)"),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),

    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

const MAX_EVIDENCE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
]);

const getUploadUrlBodySchema = z.object({
    requirementId: positiveIntIdRule, // Usa a tua regra base para IDs

    fileName: z.string().trim()
        .min(1, 'VALIDATION_UPLOAD_FILE_NAME_REQUIRED')
        .max(255, 'VALIDATION_UPLOAD_FILE_NAME_MAX_LENGTH')
        // Esta regex garante que o ficheiro tem uma extensão (ex: .pdf, .png)
        // Essencial porque o teu backend faz: fileName.split('.').pop()
        .regex(/\.[0-9a-z]+$/i, 'VALIDATION_UPLOAD_FILE_EXTENSION_INVALID'),

    // Declared MIME type and size — validated server-side before a signed URL is
    // issued, so the upload is gated on type and size (not just extension).
    contentType: z.string().trim()
        .max(150, 'VALIDATION_UPLOAD_CONTENT_TYPE_INVALID')
        .refine((v) => ALLOWED_EVIDENCE_MIME_TYPES.has(v.toLowerCase()), 'VALIDATION_UPLOAD_CONTENT_TYPE_INVALID'),

    fileSize: z.coerce.number()
        .int('VALIDATION_UPLOAD_FILE_SIZE_INVALID')
        .positive('VALIDATION_UPLOAD_FILE_SIZE_INVALID')
        .max(MAX_EVIDENCE_FILE_SIZE_BYTES, 'VALIDATION_UPLOAD_FILE_TOO_LARGE')
});

const reviewApplicationSchema = z.object({
    action: z.enum(['accept', 'reject', 'review', 'send_back'], {
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

const updateApplicationSchema = z.object({
    consultantNotes: z.string().trim()
        .max(2000, 'VALIDATION_CONSULTANT_NOTES_MAX_LENGTH')
        .transform(sanitizeText)
        .optional()
        .nullable()
});

const ALLOWED_EVIDENCE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'zip']);

module.exports = {
    startApplicationSchema,
    applicationGuidParamSchema,
    submitApplicationSchema,
    upsertEvidenceBodySchema,
    getApplicationsQuerySchema,
    getUploadUrlBodySchema,
    reviewApplicationSchema,
    reviewEvidenceSchema,
    evidenceIdParamSchema,
    updateApplicationSchema,
    ALLOWED_EVIDENCE_EXTENSIONS,
    ALLOWED_EVIDENCE_MIME_TYPES,
    MAX_EVIDENCE_FILE_SIZE_BYTES
};
