const express = require('express');
const { loginRequired } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

/**
 * @route   GET /api/users/:userGuid
 * @desc    Return another user's read-only in-platform profile by GUID.
 *          Excludes account/administrative fields (admin-only).
 * @access  Authenticated (any role)
 */
router.get('/:userGuid', loginRequired, userController.getUserProfileByGuid);

module.exports = router;
