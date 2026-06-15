const express = require('express');
const router = express.Router({ mergeParams: true });

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const requirementController = require('../controllers/badgeRequirements.controller');

/**
 * @route   GET /api/badges/:badgeSlug/requirements
 * @desc    List requirements for a badge (admins see inactive too)
 * @access  Authenticated
 */
router.get('/', loginRequired, requirementController.getRequirements);

/**
 * @route   POST /api/badges/:badgeSlug/requirements
 * @desc    Create a requirement for a badge
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, requirementController.createRequirement);

/**
 * @route   PUT /api/badges/:badgeSlug/requirements/:requirementId
 * @desc    Update a badge requirement
 * @access  Administrator
 */
router.put('/:requirementId', loginRequired, isAdmin, requirementController.updateRequirement);

/**
 * @route   DELETE /api/badges/:badgeSlug/requirements/:requirementId
 * @desc    Deactivate (soft delete) a badge requirement
 * @access  Administrator
 */
router.delete('/:requirementId', loginRequired, isAdmin, requirementController.deleteRequirement);

module.exports = router;
