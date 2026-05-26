const { z } = require('zod');

const publicBadgeLinkParam = z.object({
    link: z.string().trim().min(1, 'VALIDATION_PUBLIC_LINK_REQUIRED')
});

const publicCertificateParam = z.object({
    applicationGuid: z.string().uuid('VALIDATION_APPLICATION_GUID_INVALID')
});

const publicFormatQuery = z.object({
    format: z.enum(['json', 'html']).optional()
});

module.exports = {
    publicBadgeLinkParam,
    publicCertificateParam,
    publicFormatQuery
};
