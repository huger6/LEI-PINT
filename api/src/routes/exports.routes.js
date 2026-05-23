const express = require('express');
const router = express.Router();
const exportsCtrl = require('../controllers/exports.controller');
const { loginRequired } = require('../middlewares/auth.middleware');

// GET /api/exports/consultants?from=2026-01-01&to=2026-05-22
router.get('/consultants', loginRequired, exportsCtrl.exportConsultants);

// GET /api/exports/application-logs?from=...&to=...
router.get('/application-logs', loginRequired, exportsCtrl.exportApplicationLogs);

// GET /api/exports/applications?state=Submitted&from=...&to=...
router.get('/applications', loginRequired, exportsCtrl.exportApplications);

// GET /api/exports/badges?q=node&active=true
router.get('/badges', loginRequired, exportsCtrl.exportBadges);

// GET /api/exports/points-history?from=...&to=...
router.get('/points-history', loginRequired, exportsCtrl.exportPointsHistory);

module.exports = router;
