const express = require('express');
const router = express.Router();
const { loginRequired } = require('../middlewares/auth.middleware');
const applicationController = require('../controllers/applications.controller');


/**
 * @route   GET /api/applications
 * @desc    Lists applications: Controller filters:
 * - Consultant: only sees their applications
 * - Talent Manager: sees all applications
 * - Service Line Leader: sees their SL's applications
 */
router.get('/', loginRequired, applicationController.getApplications);

/**
 * @route   GET /api/applications/:applicationId
 * @desc    Application details
 */
router.get('/:applicationId', loginRequired, applicationController.getApplicationById);

/**
 * @route   POST /api/applications/start
 * @desc    Create new application (state -> Open)
 */
router.post('/start', loginRequired, applicationController.startApplication);

/**
 * @route   POST /api/applications/:applicationId/evidences
 * @desc    Uploads or updates an evidence for a given requirement
 */
router.post('/:applicationId/evidences', loginRequired, applicationController.upsertEvidence);

/**
 * @route   POST /api/applications/:applicationId/submit
 * @desc    Submits application (state -> Submitted)
 */
router.post('/:applicationId/submit', loginRequired, applicationController.submitApplication);

/**
 * @route   POST /api/applications/:applicationId/validate
 * @desc    Aprove, reject or send back
 */
//router.post('/:applicationId/validate', loginRequired, applicationController.validateApplication);

module.exports = router;