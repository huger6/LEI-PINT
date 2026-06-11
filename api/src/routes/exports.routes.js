const express = require('express');
const router = express.Router();
const exportsCtrl = require('../controllers/exports.controller');
const { loginRequired, leadership } = require('../middlewares/auth.middleware');

// Talent Manager / Administrator see the full datasets (global). Service Line
// Leader is also allowed, but every export is scoped to their Service Line in
// the controller (resolveExportScope) so no cross-Service-Line data leaks.
const exportAccess = leadership;

// GET /api/exports/consultants?from=2026-01-01&to=2026-05-22
router.get('/consultants', loginRequired, exportAccess, exportsCtrl.exportConsultants);

// GET /api/exports/application-logs?from=...&to=...
router.get('/application-logs', loginRequired, exportAccess, exportsCtrl.exportApplicationLogs);

// GET /api/exports/applications?state=Submitted&from=...&to=...
router.get('/applications', loginRequired, exportAccess, exportsCtrl.exportApplications);

// GET /api/exports/badges?q=node&active=true
router.get('/badges', loginRequired, exportAccess, exportsCtrl.exportBadges);

// GET /api/exports/points-history?from=...&to=...
router.get('/points-history', loginRequired, exportAccess, exportsCtrl.exportPointsHistory);

module.exports = router;
