const express = require('express');
const router = express.Router();
const exportsCtrl = require('../controllers/exports.controller');
const { loginRequired, checkRole } = require('../middlewares/auth.middleware');

// Talent Manager is a global reviewer (sees every consultant/badge/application,
// independent of Service Line), so it may export the full datasets like an Admin.
// Service Line Leader is intentionally excluded here: the consultants/badges/
// points/logs exports are not Service-Line-scoped yet, so granting SLL would leak
// data from other Service Lines.
const exportAccess = checkRole('Talent Manager', 'Administrator');

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
