const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired, optionalAuth, isAdmin } = require('../middlewares/auth.middleware');

const announcementController = require('../controllers/announcements.controller');

/**
 * @route   GET /api/announcements
 * @desc    List all announcements with pagination and filtering
 * @access  Public (admins see inactive; non-admins see only active)
 */
router.get('/', optionalAuth, announcementController.getAnnouncements);

/**
 * @route   GET /api/announcements/:announcementId
 * @desc    Get a single announcement by ID
 * @access  Authenticated
 */
router.get('/:announcementId', loginRequired, announcementController.getAnnouncementById);

/**
 * @route   POST /api/announcements
 * @desc    Create a new announcement
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, announcementController.createAnnouncement);

/**
 * @route   PUT /api/announcements/:announcementId
 * @desc    Update an existing announcement
 * @access  Administrator
 */
router.put('/:announcementId', loginRequired, isAdmin, announcementController.updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:announcementId
 * @desc    Deactivate an announcement (soft delete)
 * @access  Administrator
 */
router.delete('/:announcementId', loginRequired, isAdmin, announcementController.deleteAnnouncement);

module.exports = router;
