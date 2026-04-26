const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

// This route should start with /admin

// GET /api/admin/users
router.get('/users', loginRequired, isAdmin, adminController.getUsers);

// POST /api/admin/users
router.post('/users', loginRequired, isAdmin, adminController.createUser);

// PUT /api/admin/users/:userId
router.put('/users/:userId', loginRequired, isAdmin, adminController.updateUser);

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', loginRequired, isAdmin, adminController.deactivateUser);

// POST /api/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', loginRequired, isAdmin, adminController.resetUserPassword);

module.exports = router;
