const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const applicationController = require('../controllers/applications.controller');
const certificatesController = require('../controllers/certificates.controller');


/**
 * @route   GET /api/applications
 * @desc    Lists applications: Controller filters:
 * - Consultant: only sees their applications
 * - Talent Manager: sees all applications
 * - Service Line Leader: sees their SL's applications
 */
router.get('/', loginRequired, applicationController.getApplications);

/**
 * @route   GET /api/applications/:applicationGuid
 * @desc    Application details
 */
router.get('/:applicationGuid', loginRequired, applicationController.getApplicationById);

/**
 * @route   POST /api/applications/start
 * @desc    Create new application (state -> Open)
 */
router.post('/start', loginRequired, applicationController.startApplication);

/**
 * @route   POST /api/applications/:applicationGuid/upload-url
 */
router.post('/:applicationGuid/upload-url', loginRequired, applicationController.getUploadUrl);

/**
 * @route   POST /api/applications/:applicationGuid/evidences
 * @desc    Uploads or updates an evidence for a given requirement
 */
router.post('/:applicationGuid/evidences', loginRequired, applicationController.upsertEvidence);

/**
 * @route   POST /api/applications/:applicationGuid/submit
 * @desc    Submits application (state -> Submitted)
 */
router.post('/:applicationGuid/submit', loginRequired, applicationController.submitApplication);

/**
 * @route   PUT /api/applications/:applicationGuid/validate
 * @desc    Accept, reject or move to 'In validation'
 * @access  Talent Manager, Service Line Leader, Administrator
 */
router.put('/:applicationGuid/validate', loginRequired, applicationController.validateApplication);

/**
 * @route   PATCH /api/applications/:applicationGuid
 * @desc    Partially update an Open application (e.g. consultant notes)
 */
router.patch('/:applicationGuid', loginRequired, applicationController.updateApplication);

/**
 * @route   GET /api/applications/:applicationGuid/evidences/:evidenceId/download
 * @desc    Generate a signed download URL for an evidence file
 */
router.get('/:applicationGuid/evidences/:evidenceId/download', loginRequired, applicationController.downloadEvidence);

/**
 * @route   PUT /api/applications/:applicationGuid/evidences/:evidenceId/review
 * @desc    Approve or reject a single evidence; awards requirement points when approved
 * @access  Talent Manager, Service Line Leader
 */
router.put('/:applicationGuid/evidences/:evidenceId/review', loginRequired, applicationController.reviewEvidence);

/**
 * @route   POST /api/applications/:applicationGuid/certificate
 * @desc    Generate (or retrieve existing) PDF certificate for an Accepted application.
 *          Body: { lang: 'pt' | 'en' | 'es' }
 * @access  Consultant (own), Talent Manager, Service Line Leader, Administrator
 */
router.post('/:applicationGuid/certificate', loginRequired, certificatesController.generateCertificate);

module.exports = router;