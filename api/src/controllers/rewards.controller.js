const { Op } = require('sequelize');
const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/rewards.validation');
const gamificationService = require('../services/gamification.service');
const notificationsService = require('../services/notifications.service');
const { sendRewardRedemptionEmail } = require('../services/email.service');
const { moveStructureImageToPermanent } = require('../services/storage.service');
const redis = require('../config/redis');

// Public store shape — never leaks access_link/access_info (those are revealed
// only to the owner after redemption / by email).
const toStoreItem = (r) => ({
    rewardGuid: r.reward_guid,
    name: r.reward_name,
    description: r.reward_description,
    costPoints: r.cost_points,
    category: r.reward_category,
    imgUrl: r.img_url || null,
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

        // In-app notification: goes through the standard pipeline, which honours the
        // user's notification preferences (real-time + push when enabled). Best-effort.
        try {
            await notificationsService.createNotification({
                userId,
                definitionId: 5, // POINTS_AWARDED
                notificationType: 'POINTS',
                title: 'NOTIF_REWARD_REDEEMED_TITLE',
                body: 'NOTIF_REWARD_REDEEMED_BODY',
                meta: { rewardName: reward.reward_name, points: reward.cost_points },
                url: '/store'
            });
        } catch (notifErr) {
            logger.error('Reward redeemed but in-app notification failed', { notifErr });
        }

        // Email always goes out (it carries the access info/link) and is best-effort:
        // it must never fail the redemption. Localized via the user's language.
        try {
            const user = await models.users.findByPk(userId, {
                attributes: ['email_address', 'full_name'],
                include: [{ model: models.languages, as: 'language', attributes: ['language_iso'] }]
            });
            if (user?.email_address) {
                await sendRewardRedemptionEmail(user.email_address, user.full_name, {
                    rewardName: reward.reward_name,
                    accessLink: reward.access_link,
                    accessInfo: reward.access_info,
                    costPoints: reward.cost_points
                }, user.language?.language_iso || 'en-GB');
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
                isActive: r.is_active,
                category: r.reward_category,
                imgUrl: r.img_url || null
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
            img_url: body.imgUrl ?? null,
            cost_points: body.costPoints,
            is_active: body.isActive ?? true,
            reward_category: body.category ?? null
        });

        // Promote a freshly uploaded image from temp storage to a permanent path
        // keyed by the reward's GUID (otherwise the temp file may be reaped).
        if (body.imgUrl && body.imgUrl.includes('/temp/')) {
            const permanentUrl = await moveStructureImageToPermanent('rewards', body.imgUrl, reward.reward_guid);
            if (permanentUrl !== body.imgUrl) await reward.update({ img_url: permanentUrl });
        }

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
        if (body.imgUrl !== undefined) {
            // Move a newly uploaded temp image to a permanent reward-scoped path.
            fields.img_url = body.imgUrl && body.imgUrl.includes('/temp/')
                ? await moveStructureImageToPermanent('rewards', body.imgUrl, rewardGuid)
                : body.imgUrl;
        }
        if (body.costPoints !== undefined) fields.cost_points = body.costPoints;
        if (body.isActive !== undefined) fields.is_active = body.isActive;
        if (body.category !== undefined) fields.reward_category = body.category;

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

// Strip a leading "Exclusive Title: " / "Título Exclusivo: " marker so the
// displayed title is just the title itself.
const cleanTitle = (name) => String(name || '').replace(/^\s*(Exclusive Title|T[íi]tulo Exclusivo)\s*:\s*/i, '').trim();

/*──────────────────────────────────────────────────────────────
  GET /api/rewards/titles
  The titles the consultant has unlocked (redeemed title rewards),
  plus the one they currently display.
──────────────────────────────────────────────────────────────*/
const getOwnedTitles = async (req, res) => {
    try {
        const userId = req.user.sub;

        // (a) Titles unlocked by redeeming title-category rewards in the store.
        const redemptions = await models.reward_redemptions.findAll({
            where: { user_id: userId },
            include: [{
                model: models.rewards, as: 'reward',
                attributes: ['reward_id', 'reward_guid', 'reward_name', 'special_title', 'reward_category'],
                where: { reward_category: 'title' }
            }]
        });

        // (b) Titles granted by earning a special badge: a title-reward linked to
        // a badge the consultant has been awarded.
        const earned = await models.awarded_badges.findAll({
            where: { user_id: userId },
            attributes: ['awarded_badges_id'],
            include: [{ model: models.badge_applications, as: 'application', attributes: ['badge_id'] }]
        });
        const earnedBadgeIds = [...new Set(earned.map((a) => a.application?.badge_id).filter(Boolean))];

        let badgeTitleRewards = [];
        if (earnedBadgeIds.length) {
            badgeTitleRewards = await models.rewards.findAll({
                where: { reward_category: 'title', badge_id: { [Op.in]: earnedBadgeIds } },
                attributes: ['reward_id', 'reward_guid', 'reward_name', 'special_title']
            });
        }

        const rewardRows = [
            ...redemptions.map((r) => r.reward).filter(Boolean),
            ...badgeTitleRewards
        ];

        const seen = new Set();
        const titles = rewardRows
            .filter((r) => {
                const rid = r?.reward_id;
                if (!rid || seen.has(rid)) return false;
                seen.add(rid);
                return true;
            })
            .map((r) => ({
                rewardGuid: r.reward_guid,
                title: cleanTitle(r.special_title || r.reward_name)
            }))
            .filter((t) => t.title);
        const consultant = await models.consultants.findOne({
            where: { user_id: userId },
            attributes: ['active_title', 'active_title_reward_id'],
            include: [{ model: models.rewards, as: 'active_title_reward', attributes: ['reward_guid'] }]
        });
        return res.status(200).json({
            success: true,
            data: {
                titles,
                activeTitle: consultant?.active_title || null,
                activeTitleRewardGuid: consultant?.active_title_reward?.reward_guid || null
            }
        });
    } catch (error) {
        logger.error('Error fetching owned titles', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_TITLES_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  PATCH /api/rewards/active-title   Body: { rewardGuid: string|null }
  Sets (or clears) the consultant's publicly displayed title; the
  reward must be a title-category reward the consultant has redeemed.
──────────────────────────────────────────────────────────────*/
const setActiveTitle = async (req, res) => {
    try {
        const parsed = validations.activeTitleBodySchema.safeParse(req.body);
        if (!parsed.success) return handleZodError(res, parsed.error);

        const userId = req.user.sub;
        const { rewardGuid } = parsed.data;

        let titleText = null;
        let rewardId = null;

        if (rewardGuid) {
            const reward = await models.rewards.findOne({
                where: { reward_guid: rewardGuid, reward_category: 'title' },
                attributes: ['reward_id', 'reward_name', 'special_title', 'badge_id']
            });
            if (!reward) {
                return res.status(404).json({ success: false, code: 'REWARDS_NOT_FOUND' });
            }
            // The consultant owns the title if they redeemed it OR if it is granted
            // by a special badge they have earned.
            let owns = !!(await models.reward_redemptions.findOne({
                where: { user_id: userId, reward_id: reward.reward_id }
            }));
            if (!owns && reward.badge_id) {
                const earnedBadge = await models.awarded_badges.findOne({
                    where: { user_id: userId },
                    attributes: ['awarded_badges_id'],
                    include: [{
                        model: models.badge_applications, as: 'application',
                        attributes: [], required: true, where: { badge_id: reward.badge_id }
                    }]
                });
                owns = !!earnedBadge;
            }
            if (!owns) {
                return res.status(403).json({ success: false, code: 'REWARDS_TITLE_NOT_OWNED' });
            }
            titleText = cleanTitle(reward.special_title || reward.reward_name);
            rewardId = reward.reward_id;
        }

        await models.consultants.update(
            { active_title: titleText, active_title_reward_id: rewardId },
            { where: { user_id: userId } }
        );
        await redis.del(`user:profile:${userId}`).catch(() => {});
        return res.status(200).json({
            success: true,
            code: 'REWARDS_ACTIVE_TITLE_UPDATED',
            data: { activeTitle: titleText, activeTitleRewardGuid: rewardGuid || null }
        });
    } catch (error) {
        logger.error('Error setting active title', { error });
        return res.status(500).json({ success: false, code: 'REWARDS_ACTIVE_TITLE_FAILED' });
    }
};

module.exports = {
    listRewards,
    getMyRedemptions,
    redeemReward,
    adminListRewards,
    createReward,
    updateReward,
    deleteReward,
    getOwnedTitles,
    setActiveTitle
};
