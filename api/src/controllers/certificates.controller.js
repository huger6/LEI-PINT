const { logger } = require('../utils/logger');
const validations = require('../validations/certificates.validation');
const certificateService = require('../services/certificate.service');

/*──────────────────────────────────────────────────────────────
  POST /api/applications/:applicationGuid/certificate
  Generates (or returns the existing) PDF certificate for an
  Accepted application. Idempotent: once a certificate exists
  it is returned without regenerating.

  Body: { lang: 'pt' | 'en' | 'es' }   (defaults to 'en')

  Access:
    - Consultant: only their own application
    - Talent Manager / Service Line Leader / Administrator: any
──────────────────────────────────────────────────────────────*/
const generateCertificate = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        const { applicationGuid } = validations.generateCertificateParamSchema.parse(req.params);
        const { lang } = validations.generateCertificateBodySchema.parse(req.body);

        // Consultants are scoped to their own applications; leadership sees all
        const requestingUserId = role === 'Consultant' ? userId : null;

        const { certificateUrl, isNew } = await certificateService.getOrCreateCertificate(
            applicationGuid,
            lang,
            requestingUserId
        );

        return res.status(isNew ? 201 : 200).json({
            success: true,
            code: isNew ? 'CERTIFICATE_GENERATED' : 'CERTIFICATE_ALREADY_EXISTS',
            data: { certificateUrl }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.errors
            });
        }

        if (error.code === 'CERTIFICATE_NOT_ELIGIBLE') {
            return res.status(403).json({
                success: false,
                code: 'CERTIFICATE_NOT_ELIGIBLE'
            });
        }

        logger.error('Error generating certificate', { error });
        return res.status(500).json({
            success: false,
            code: 'CERTIFICATE_GENERATION_FAILED'
        });
    }
};

module.exports = { generateCertificate };
