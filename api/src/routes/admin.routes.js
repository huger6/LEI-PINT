const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { loginRequired, checkRole } = require('../middlewares/auth.middleware');

// This route should start with /admin

// GET /api/admin/users
router.get('/users', loginRequired, checkRole('Administrator'), adminController.getUsers);

// POST /api/admin/users
router.post('/users', loginRequired, checkRole('Administrator'), adminController.createUser);

// PUT /api/admin/users/:userId
router.put('/users/:userId', loginRequired, checkRole('Administrator'), adminController.updateUser);

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', loginRequired, checkRole('Administrator'), adminController.deactivateUser);

// POST /api/admin/users/:userId/reset-password
router.post('/users/:userId/reset-password', loginRequired, checkRole('Administrator'), adminController.resetUserPassword);

module.exports = router;
