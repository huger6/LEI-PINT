const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { annonymousUsersOnly, loginRequired, checkRole } = require('../middlewares/auth.middleware');

// POST /api/admin/auth/login
router.post('/login', annonymousUsersOnly, adminController.login);

// POST /api/admin/auth/refresh
router.post('/refresh', adminController.refresh);

// POST /api/admin/auth/logout
router.post('/logout', loginRequired, checkRole('Administrator'), adminController.logout);

module.exports = router;