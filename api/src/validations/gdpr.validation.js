const { z } = require('zod');
const { positiveIntIdRule } = require('./shared-rules');

const consentBodySchema = z.object({
    policy_id: positiveIntIdRule,
    action: z.enum(['ACCEPTED', 'REVOKED'], { message: 'VALIDATION_GDPR_ACTION_INVALID' })
});

const policyIdParam = z.object({
    id: positiveIntIdRule
});

const createPolicyBody = z.object({
    policy_type: z.enum(['Privacy', 'Terms', 'Cookies'], { message: 'VALIDATION_GDPR_POLICY_TYPE_INVALID' }),
    version: z.string().trim().min(1).max(30, 'VALIDATION_GDPR_VERSION_MAX_LENGTH'),
    policy_text: z.string().trim().min(1, 'VALIDATION_GDPR_TEXT_REQUIRED'),
    is_mandatory: z.boolean().default(true)
});

const updatePolicyBody = z.object({
    is_mandatory: z.boolean().optional(),
    is_active: z.boolean().optional()
});

const policyTypeParam = z.object({
    type: z.enum(['Privacy', 'Terms', 'Cookies'], { message: 'VALIDATION_GDPR_POLICY_TYPE_INVALID' })
});

const newPolicyVersionBody = z.object({
    policy_text: z.string().trim().min(1, 'VALIDATION_GDPR_TEXT_REQUIRED'),
    version: z.string().trim().min(1).max(30, 'VALIDATION_GDPR_VERSION_MAX_LENGTH'),
    is_mandatory: z.boolean().optional()
});

module.exports = {
    consentBodySchema,
    policyIdParam,
    policyTypeParam,
    createPolicyBody,
    updatePolicyBody,
    newPolicyVersionBody
};
