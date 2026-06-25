const { models } = require('../config/db');
const { generateCertificatePDF } = require('../utils/certificate.generator');
const { uploadBuffer, deleteFile } = require('./storage.service');
const { logger } = require('../utils/logger');

const ISSUING_ENTITY = process.env.CERTIFICATE_ISSUING_ENTITY || 'Organization';
const CERTIFICATE_BUCKET = 'public-assets';

/**
 * Fetches all data required to generate a certificate for the given application.
 * Returns null if the application is not in Accepted state.
 *
 * @param {string} applicationGuid
 * @param {number} requestingUserId - used for ownership check (pass null to skip)
 * @returns {Promise<object|null>}
 */
const fetchCertificateData = async (applicationGuid, requestingUserId = null, allowedServiceLineId = null) => {
    const application = await models.badge_applications.findOne({
        where: { application_guid: applicationGuid },
        include: [
            {
                model: models.badges,
                as: 'badge',
                attributes: ['badge_title', 'badge_description', 'badge_img_url', 'badge_points', 'service_line_id']
            },
            {
                model: models.consultants,
                as: 'user',
                include: [{
                    model: models.users,
                    as: 'user',
                    attributes: ['user_id', 'user_guid', 'full_name']
                }]
            },
            {
                model: models.application_validation_logs,
                as: 'application_validation_logs',
                include: [{
                    model: models.users,
                    as: 'user',
                    attributes: ['full_name']
                }]
            },
            {
                model: models.certificates,
                as: 'certificate'
            }
        ]
    });

    if (!application) return null;

    // Ownership guard: consultants can only fetch their own
    if (requestingUserId !== null && application.user_id !== requestingUserId) return null;

    // Service Line scope guard: a Service Line Leader may only generate
    // certificates for applications inside their own Service Line.
    if (allowedServiceLineId !== null && application.badge?.service_line_id !== allowedServiceLineId) return null;

    if (application.application_state !== 'Accepted') return null;

    const logs = application.application_validation_logs || [];

    const tmLog = logs.find(
        (l) => l.validator_function === 'Talent Manager' && l.validator_action === 'Request Review'
    );
    const sllLog = logs.find(
        (l) => l.validator_function === 'Service Line Leader' && l.validator_action === 'Accept'
    );

    return {
        application,
        badge: {
            title: application.badge.badge_title,
            description: application.badge.badge_description || null
        },
        consultant: {
            fullName: application.user.user.full_name,
            userGuid: application.user.user.user_guid
        },
        tmReviewer: tmLog ? { fullName: tmLog.user.full_name } : null,
        sllReviewer: sllLog ? { fullName: sllLog.user.full_name } : null,
        dates: {
            startDate: application.opened_at,
            conclusionDate: application.closed_at
        },
        issuingEntity: ISSUING_ENTITY,
        existingCertificate: application.certificate || null
    };
};

const extractStoragePath = (url) => {
    if (!url) return null;
    const marker = `/${CERTIFICATE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
};

/**
 * Generates a PDF certificate, uploads it to Supabase, persists the record in DB,
 * and links it to the application.
 *
 * Idempotent: if a certificate already exists for this application it is returned
 * without regenerating.
 *
 * @param {string} applicationGuid
 * @param {'pt'|'en'|'es'} lang
 * @param {number|null} requestingUserId
 * @returns {Promise<{ certificateUrl: string, isNew: boolean }>}
 */
const getOrCreateCertificate = async (applicationGuid, lang, requestingUserId = null, allowedServiceLineId = null) => {
    const data = await fetchCertificateData(applicationGuid, requestingUserId, allowedServiceLineId);

    if (!data) {
        const err = new Error('Application not found, not accepted, or access denied');
        err.code = 'CERTIFICATE_NOT_ELIGIBLE';
        throw err;
    }

    if (data.existingCertificate?.certificate_file_url) {
        if (data.existingCertificate.language_code === lang) {
            return { certificateUrl: data.existingCertificate.certificate_file_url, isNew: false };
        }
        await models.certificates.destroy({
            where: { certificate_id: data.existingCertificate.certificate_id }
        });
        try {
            const oldPath = extractStoragePath(data.existingCertificate.certificate_file_url);
            if (oldPath) await deleteFile(CERTIFICATE_BUCKET, oldPath);
        } catch (e) {
            logger.warn('Could not delete old certificate file from storage', { error: e });
        }
    }

    const verificationUrl = `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/public/certificate/${applicationGuid}`;

    const pdfBuffer = await generateCertificatePDF({
        lang,
        badge: data.badge,
        consultant: data.consultant,
        tmReviewer: data.tmReviewer,
        sllReviewer: data.sllReviewer,
        dates: data.dates,
        issuingEntity: data.issuingEntity,
        verificationUrl
    });

    const storagePath = `certificates/${data.consultant.userGuid}/application_${applicationGuid}/certificate_${lang}.pdf`;

    // Some Supabase instances may restrict mime types; use binary/octet as fallback
    const certificateUrl = await uploadBuffer(CERTIFICATE_BUCKET, storagePath, pdfBuffer, 'application/octet-stream');

    const certificate = await models.certificates.create({
        application_id: data.application.application_id,
        certificate_title: data.badge.title,
        issuing_entity: data.issuingEntity,
        issue_date: data.dates.conclusionDate,
        certificate_file_url: certificateUrl,
        language_code: lang
    });

    logger.info('Certificate generated and stored', {
        applicationGuid,
        certificateId: certificate.certificate_id,
        lang
    });

    return { certificateUrl, isNew: true };
};

module.exports = { getOrCreateCertificate, fetchCertificateData };
