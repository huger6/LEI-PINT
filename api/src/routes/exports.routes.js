const express = require('express');
const router = express.Router();
const exportsCtrl = require('../controllers/exports.controller');
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

// GET /api/exports/consultants?from=2026-01-01&to=2026-05-22
router.get('/consultants', loginRequired, isAdmin, exportsCtrl.exportConsultants);

// GET /api/exports/application-logs?from=...&to=...
router.get('/application-logs', loginRequired, isAdmin, exportsCtrl.exportApplicationLogs);

// GET /api/exports/applications?state=Submitted&from=...&to=...
router.get('/applications', loginRequired, isAdmin, exportsCtrl.exportApplications);

// GET /api/exports/badges?q=node&active=true
router.get('/badges', loginRequired, isAdmin, exportsCtrl.exportBadges);

// GET /api/exports/points-history?from=...&to=...
router.get('/points-history', loginRequired, isAdmin, exportsCtrl.exportPointsHistory);

module.exports = router;
