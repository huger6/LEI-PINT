const express = require('express');
const router = express.Router();

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const gdprCtrl = require('../controllers/gdpr.controller');

// ─── Public/User endpoints ──────────────────────────────────────────────────
router.get('/policies', gdprCtrl.getActivePolicies);
router.get('/policies/:id', gdprCtrl.getPolicyById);
router.post('/consent', loginRequired, gdprCtrl.recordConsent);
router.get('/consent/history', loginRequired, gdprCtrl.getConsentHistory);
router.post('/data-export', loginRequired, gdprCtrl.requestDataExport);
router.delete('/account', loginRequired, gdprCtrl.requestAccountDeletion);

// ─── Admin endpoints ────────────────────────────────────────────────────────
router.post('/admin/policies', loginRequired, isAdmin, gdprCtrl.adminCreatePolicy);
router.put('/admin/policies/:id', loginRequired, isAdmin, gdprCtrl.adminUpdatePolicy);
router.patch('/admin/policies/:id/deactivate', loginRequired, isAdmin, gdprCtrl.adminDeactivatePolicy);

module.exports = router;
