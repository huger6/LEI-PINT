const express = require('express');
const router = express.Router();
const { loginRequired, checkRole, isAdmin } = require('../middlewares/auth.middleware');
const rewardsController = require('../controllers/rewards.controller');

const consultantOnly = checkRole('Consultant');

/**
 * @route   GET /api/rewards
 * @desc    Points store: active rewards + the consultant's balance
 * @access  Consultant
 */
router.get('/', loginRequired, consultantOnly, rewardsController.listRewards);

/**
 * @route   GET /api/rewards/redemptions
 * @desc    The consultant's redemption history (with access info)
 * @access  Consultant
 */
router.get('/redemptions', loginRequired, consultantOnly, rewardsController.getMyRedemptions);

/**
 * @route   POST /api/rewards/:rewardGuid/redeem
 * @desc    Spend points to redeem a reward (emails the access info)
 * @access  Consultant
 */
router.post('/:rewardGuid/redeem', loginRequired, consultantOnly, rewardsController.redeemReward);

/**
 * @route   GET /api/rewards/titles
 * @desc    Titles the consultant has unlocked + the one currently displayed
 * @access  Consultant
 */
router.get('/titles', loginRequired, consultantOnly, rewardsController.getOwnedTitles);

/**
 * @route   PATCH /api/rewards/active-title
 * @desc    Set/clear the consultant's publicly displayed title
 * @access  Consultant
 */
router.patch('/active-title', loginRequired, consultantOnly, rewardsController.setActiveTitle);

/**
 * @route   GET /api/rewards/admin
 * @desc    List all store rewards (active + inactive)
 * @access  Administrator
 */
router.get('/admin', loginRequired, isAdmin, rewardsController.adminListRewards);

/**
 * @route   POST /api/rewards
 * @desc    Create a store reward
 * @access  Administrator
 */
router.post('/', loginRequired, isAdmin, rewardsController.createReward);

/**
 * @route   PUT /api/rewards/:rewardGuid
 * @desc    Update a store reward
 * @access  Administrator
 */
router.put('/:rewardGuid', loginRequired, isAdmin, rewardsController.updateReward);

/**
 * @route   DELETE /api/rewards/:rewardGuid
 * @desc    Deactivate a store reward
 * @access  Administrator
 */
router.delete('/:rewardGuid', loginRequired, isAdmin, rewardsController.deleteReward);

module.exports = router;
