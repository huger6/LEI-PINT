const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { annonymousUsersOnly, loginRequired, checkRole } = require('../middlewares/auth.middleware');


module.exports = router;