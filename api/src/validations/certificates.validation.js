const { z } = require('zod');
require('./error-map');
const { uuidRule } = require('./shared-rules');
const { SUPPORTED_LANGS } = require('../utils/certificate.generator');

const generateCertificateParamSchema = z.object({
    applicationGuid: uuidRule
});

const generateCertificateBodySchema = z.object({
    lang: z.enum(SUPPORTED_LANGS, {
        errorMap: () => ({ message: 'VALIDATION_CERTIFICATE_LANG_INVALID' })
    }).default('en')
});

module.exports = {
    generateCertificateParamSchema,
    generateCertificateBodySchema
};
