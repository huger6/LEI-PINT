const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/auth.middleware');
const utils = require('../controllers/utils.controllers');

// --- Unique field availability ---

/**
 * @route   GET /api/utils/check/username?value=...
 * @desc    Check whether a username is already taken
 * @access  Public
 */
router.get('/check/username', optionalAuth, utils.checkUsername);

/**
 * @route   GET /api/utils/check/email?value=...
 * @desc    Check whether an email address is already registered
 * @access  Public
 */
router.get('/check/email', optionalAuth, utils.checkEmail);

// --- Slug availability ---

/**
 * @route   GET /api/utils/check/slug/area?value=...
 * @desc    Check whether an area slug is available
 * @access  Public
 */
router.get('/check/slug/area', optionalAuth, utils.checkAreaSlug);

/**
 * @route   GET /api/utils/check/slug/service-line?value=...
 * @desc    Check whether a service line slug is available
 * @access  Public
 */
router.get('/check/slug/service-line', optionalAuth, utils.checkServiceLineSlug);

/**
 * @route   GET /api/utils/check/slug/learning-path?value=...
 * @desc    Check whether a learning path slug is available
 * @access  Public
 */
router.get('/check/slug/learning-path', optionalAuth, utils.checkLearningPathSlug);

/**
 * @route   GET /api/utils/check/slug/badge?value=...
 * @desc    Check whether a badge slug is available
 * @access  Public
 */
router.get('/check/slug/badge', optionalAuth, utils.checkBadgeSlug);

// --- Content validation (no DB lookup) ---

/**
 * @route   POST /api/utils/check/biography
 * @desc    Validate biography text (length, prohibited content)
 * @access  Public
 */
router.post('/check/biography', optionalAuth, utils.checkBiography);

module.exports = router;
