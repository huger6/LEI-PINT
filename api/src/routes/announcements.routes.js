const express = require('express');
const router = express.Router({ mergeParams: true });
const { loginRequired, optionalAuth, leadership } = require('../middlewares/auth.middleware');

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
 * @access  Administrator, Talent Manager, Service Line Leader
 */
router.post('/', loginRequired, leadership, announcementController.createAnnouncement);

/**
 * @route   PUT /api/announcements/:announcementId
 * @desc    Update an existing announcement
 * @access  Administrator (any), Talent Manager / Service Line Leader (own only)
 */
router.put('/:announcementId', loginRequired, leadership, announcementController.updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:announcementId
 * @desc    Deactivate an announcement (soft delete)
 * @access  Administrator (any), Talent Manager / Service Line Leader (own only)
 */
router.delete('/:announcementId', loginRequired, leadership, announcementController.deleteAnnouncement);

module.exports = router;
