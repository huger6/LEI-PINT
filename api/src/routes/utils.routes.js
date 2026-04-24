const express = require('express');
const router = express.Router();
const utils = require('../controllers/utils.controllers');

// Unique field availability checks
router.get('/check/username', utils.checkUsername);
router.get('/check/email', utils.checkEmail);

// Slug availability checks
router.get('/check/slug/area', utils.checkAreaSlug);
router.get('/check/slug/service-line', utils.checkServiceLineSlug);
router.get('/check/slug/learning-path', utils.checkLearningPathSlug);
router.get('/check/slug/badge', utils.checkBadgeSlug);

// Content validation (no DB lookup)
router.post('/check/biography', utils.checkBiography);

module.exports = router;
