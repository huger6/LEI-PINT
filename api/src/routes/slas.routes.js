const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');

const slaController = require('../controllers/slas.controller');

/**
 * @route   GET /api/slas
 * @desc    List all SLAs with pagination and filtering
 * @access  Public (admins see inactive; non-admins see only active)
 */
router.get('/', slaController.getSLAs);

/**
 * @route   GET /api/slas/:slaId
 * @desc    Get a single SLA by ID
 * @access  Authenticated
 */
router.get('/:slaId', loginRequired, slaController.getSLAById);

/**
 * @route   POST /api/slas
 * @desc    Create a new SLA
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, slaController.createSLA);

/**
 * @route   PUT /api/slas/:slaId
 * @desc    Update an existing SLA
 * @access  Administrator
 */
router.put('/:slaId', loginRequired, isAdmin, slaController.updateSLA);

/**
 * @route   DELETE /api/slas/:slaId
 * @desc    Deactivate an SLA (soft delete)
 * @access  Administrator
 */
router.delete('/:slaId', loginRequired, isAdmin, slaController.deleteSLA);

module.exports = router;
