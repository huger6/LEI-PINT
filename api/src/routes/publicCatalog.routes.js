const express = require('express');
const router = express.Router();
const publicCtrl = require('../controllers/public.controller');

// Public (no auth) badge catalog JSON for the /softinsa microsite.
// Mounted under /api/public so it is reachable through the same client/proxy.
router.get('/badges', publicCtrl.listPublicBadges);
router.get('/badges/:slug', publicCtrl.getPublicBadgeBySlug);

module.exports = router;
