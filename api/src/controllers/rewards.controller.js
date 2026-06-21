const { Op } = require('sequelize');
const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/rewards.validation');
const gamificationService = require('../services/gamification.service');
const { sendRewardRedemptionEmail } = require('../services/email.service');

// Public store shape — never leaks access_link/access_info (those are revealed
// only to the owner after redemption / by email).
const toStoreItem = (r) => ({
    rewardGuid: r.reward_guid,
    name: r.reward_name,
    description: r.reward_description,
    costPoints: r.cost_points,
});

/*──────────────────────────────────────────────────────────────
  GET /api/rewards   (Consultant store)
  Active rewards + the consultant's current points balance and the
  set of rewards they already redeemed.
──────────────────────────────────────────────────────────────*/
const listRewards = async (req, res) => {
    try {
        const userId = req.user.sub;

        const rewards = await models.rewards.findAll({
            // Store items only — legacy badge-title rows have a null reward_name.
            where: { is_active: true, reward_name: { [Op.ne]: null } },
            order: [['cost_points', 'ASC']]
        });

        const { totalPoints } = await gamificationService.getConsultantPointsSummary(userId);

        const redeemed = await models.reward_redemptions.findAll({
            where: { user_id: userId },
            include: [{ model: models.rewards, as: 'reward', attributes: ['reward_guid'] }]
        });
        const redeemedGuids = redeemed.map((x) => x.reward?.reward_guid).filter(Boolean);

        return res.status(200).json({
            success: true,
            data: {
                balance: totalPoints,
                redeemedGuids,
                rewards: rewards.map(toStoreItem)
            }
        });
    } catch (error) {
        logger.error('Error listing rewards', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  GET /api/rewards/redemptions   (Consultant)
  The consultant's redemption history (incl. access link/info).
──────────────────────────────────────────────────────────────*/
const getMyRedemptions = async (req, res) => {
    try {
        const userId = req.user.sub;
        const rows = await models.reward_redemptions.findAll({
            where: { user_id: userId },
            include: [{ model: models.rewards, as: 'reward', attributes: ['reward_name', 'access_link', 'access_info'] }],
            order: [['redeemed_at', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            data: rows.map((r) => ({
                redemptionGuid: r.redemption_guid,
                name: r.reward?.reward_name || null,
                accessLink: r.reward?.access_link || null,
                accessInfo: r.reward?.access_info || null,
                pointsSpent: r.points_spent,
                redeemedAt: r.redeemed_at
            }))
        });
    } catch (error) {
        logger.error('Error fetching redemptions', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_REDEMPTIONS_FETCH_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  POST /api/rewards/:rewardGuid/redeem   (Consultant)
  Spends points: validates balance, records the redemption + a
  negative points_history entry, then emails the access info.
──────────────────────────────────────────────────────────────*/
const redeemReward = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.sub;
        const { rewardGuid } = validations.rewardGuidParamSchema.parse(req.params);

        const reward = await models.rewards.findOne({
            where: { reward_guid: rewardGuid, is_active: true, reward_name: { [Op.ne]: null } },
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!reward) {
            await t.rollback();
            return res.status(404).json({ success: false, code: 'REWARDS_NOT_FOUND' });
        }

        const { totalPoints } = await gamificationService.getConsultantPointsSummary(userId);
        if (totalPoints < reward.cost_points) {
            await t.rollback();
            return res.status(400).json({ success: false, code: 'REWARDS_INSUFFICIENT_POINTS' });
        }

        await models.points_history.create({
            user_id: userId,
            points_delta: -reward.cost_points,
            justification: `Resgate de recompensa: ${reward.reward_name}`
        }, { transaction: t });

        const redemption = await models.reward_redemptions.create({
            reward_id: reward.reward_id,
            user_id: userId,
            points_spent: reward.cost_points
        }, { transaction: t });

        await t.commit();

        // Email is best-effort and must not fail the redemption.
        try {
            const user = await models.users.findByPk(userId, { attributes: ['email_address', 'full_name'] });
            if (user?.email_address) {
                await sendRewardRedemptionEmail(user.email_address, user.full_name, {
                    rewardName: reward.reward_name,
                    accessLink: reward.access_link,
                    accessInfo: reward.access_info,
                    costPoints: reward.cost_points
                });
            }
        } catch (mailErr) {
            logger.error('Reward redeemed but email failed', { mailErr });
        }

        return res.status(201).json({
            success: true,
            code: 'REWARDS_REDEEMED',
            data: {
                redemptionGuid: redemption.redemption_guid,
                name: reward.reward_name,
                accessLink: reward.access_link,
                accessInfo: reward.access_info,
                pointsSpent: reward.cost_points
            }
        });
    } catch (error) {
        await t.rollback();
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error redeeming reward', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_REDEEM_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  Admin: manage store rewards.
──────────────────────────────────────────────────────────────*/
const adminListRewards = async (req, res) => {
    try {
        const rewards = await models.rewards.findAll({
            where: { reward_name: { [Op.ne]: null } },
            order: [['is_active', 'DESC'], ['cost_points', 'ASC']]
        });
        return res.status(200).json({
            success: true,
            data: rewards.map((r) => ({
                rewardGuid: r.reward_guid,
                name: r.reward_name,
                description: r.reward_description,
                accessLink: r.access_link,
                accessInfo: r.access_info,
                costPoints: r.cost_points,
                isActive: r.is_active
            }))
        });
    } catch (error) {
        logger.error('Error listing rewards (admin)', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_FETCH_FAILED' });
    }
};

const createReward = async (req, res) => {
    try {
        const body = validations.rewardBodySchema.parse(req.body);
        const reward = await models.rewards.create({
            reward_name: body.name,
            reward_description: body.description ?? null,
            access_link: body.accessLink ?? null,
            access_info: body.accessInfo ?? null,
            cost_points: body.costPoints,
            is_active: body.isActive ?? true
        });
        return res.status(201).json({ success: true, code: 'REWARDS_CREATED', data: { rewardGuid: reward.reward_guid } });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error creating reward', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_CREATE_FAILED' });
    }
};

const updateReward = async (req, res) => {
    try {
        const { rewardGuid } = validations.rewardGuidParamSchema.parse(req.params);
        const body = validations.rewardBodySchema.partial().parse(req.body);
        const fields = {};
        if (body.name !== undefined) fields.reward_name = body.name;
        if (body.description !== undefined) fields.reward_description = body.description;
        if (body.accessLink !== undefined) fields.access_link = body.accessLink;
        if (body.accessInfo !== undefined) fields.access_info = body.accessInfo;
        if (body.costPoints !== undefined) fields.cost_points = body.costPoints;
        if (body.isActive !== undefined) fields.is_active = body.isActive;

        const [updated] = await models.rewards.update(fields, { where: { reward_guid: rewardGuid } });
        if (updated === 0) return res.status(404).json({ success: false, code: 'REWARDS_NOT_FOUND' });
        return res.status(200).json({ success: true, code: 'REWARDS_UPDATED' });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error updating reward', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_UPDATE_FAILED' });
    }
};

const deleteReward = async (req, res) => {
    try {
        const { rewardGuid } = validations.rewardGuidParamSchema.parse(req.params);
        // Soft-delete: deactivate so existing redemptions/history stay intact.
        const [updated] = await models.rewards.update({ is_active: false }, { where: { reward_guid: rewardGuid } });
        if (updated === 0) return res.status(404).json({ success: false, code: 'REWARDS_NOT_FOUND' });
        return res.status(200).json({ success: true, code: 'REWARDS_DELETED' });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error deleting reward', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_DELETE_FAILED' });
    }
};

module.exports = {
    listRewards,
    getMyRedemptions,
    redeemReward,
    adminListRewards,
    createReward,
    updateReward,
    deleteReward
};
