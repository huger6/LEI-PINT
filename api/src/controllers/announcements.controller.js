const { Op } = require('sequelize');
const { models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const { invalidateCacheByPrefix } = require('../utils/listHelper');
const validations = require('../validations/announcements.validation');
const { handleZodError } = require('../utils/responseHelper');

// GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'Administrator';

        const { page, limit, search, isActive, isGlobal, targetProfile, announcementType } = validations.getAnnouncementsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const cacheKey = `announcements:list:${Buffer.from(JSON.stringify({ isActive, isGlobal, targetProfile, announcementType, search, isAdmin, page, limit })).toString('base64')}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, ...JSON.parse(cached) });
        }

        const where = {};

        if (!isAdmin) {
            where.is_active = true;
        } else if (isActive !== undefined) {
            where.is_active = isActive;
        }

        if (isGlobal !== undefined) where.is_global = isGlobal;
        if (targetProfile) where.target_profile = targetProfile;
        if (announcementType) where.announcement_type = announcementType;
        if (search) where.announcement_title = { [Op.iLike]: `%${search}%` };

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const { rows, count } = await models.system_announcements.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: { exclude: excludedFields },
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        if (page > totalPages && count > 0) {
            return res.status(404).json({ success: false, code: 'PAGINATION_PAGE_NOT_FOUND' });
        }

        const responseData = {
            data: rows,
            pagination: { totalItems: count, totalPages, currentPage: page }
        };

        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 7200);

        return res.status(200).json({ success: true, ...responseData });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error listing announcements', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_LIST_FAILED' });
    }
};

// GET /api/announcements/:announcementId
const getAnnouncementById = async (req, res) => {
    try {
        const { announcementId } = validations.announcementIdParamSchema.parse(req.params);
        const isAdmin = req.user?.role === 'Administrator';

        const where = {
            announcement_id: announcementId,
            ...(isAdmin ? {} : { is_active: true })
        };

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const announcement = await models.system_announcements.findOne({
            where,
            attributes: { exclude: excludedFields }
        });

        if (!announcement) {
            return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
        }

        return res.status(200).json({ success: true, data: announcement });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_URL_PARAM');

        logger.error('Error fetching announcement', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_FETCH_FAILED' });
    }
};

// POST /api/announcements
const createAnnouncement = async (req, res) => {
    try {
        const userId = req.user.sub;

        const {
            announcementTitle,
            announcementMessage,
            startsAt,
            endsAt,
            announcementType,
            targetProfile,
            isGlobal,
            userId: targetUserId
        } = validations.createAnnouncementBodySchema.parse(req.body);

        const newAnnouncement = await models.system_announcements.create({
            announcement_title: announcementTitle,
            announcement_message: announcementMessage,
            starts_at: startsAt ?? null,
            ends_at: endsAt ?? null,
            announcement_type: announcementType ?? null,
            target_profile: targetProfile ?? null,
            is_global: isGlobal ?? null,
            user_id: targetUserId ?? null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('announcements:list');

        return res.status(201).json({ success: true, code: 'ANNOUNCEMENT_CREATED', data: newAnnouncement });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error creating announcement', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_CREATE_FAILED' });
    }
};

// PUT /api/announcements/:announcementId
const updateAnnouncement = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { announcementId } = validations.announcementIdParamSchema.parse(req.params);

        const {
            announcementTitle,
            announcementMessage,
            startsAt,
            endsAt,
            announcementType,
            targetProfile,
            isGlobal,
            isActive,
            userId: targetUserId
        } = validations.updateAnnouncementBodySchema.parse(req.body);

        const announcement = await models.system_announcements.findOne({
            where: { announcement_id: announcementId }
        });

        if (!announcement) {
            return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
        }

        await announcement.update({
            announcement_title: announcementTitle !== undefined ? announcementTitle : announcement.announcement_title,
            announcement_message: announcementMessage !== undefined ? announcementMessage : announcement.announcement_message,
            starts_at: startsAt !== undefined ? startsAt : announcement.starts_at,
            ends_at: endsAt !== undefined ? endsAt : announcement.ends_at,
            announcement_type: announcementType !== undefined ? announcementType : announcement.announcement_type,
            target_profile: targetProfile !== undefined ? targetProfile : announcement.target_profile,
            is_global: isGlobal !== undefined ? isGlobal : announcement.is_global,
            is_active: isActive !== undefined ? isActive : announcement.is_active,
            user_id: targetUserId !== undefined ? targetUserId : announcement.user_id,
            updated_by: userId,
            updated_at: new Date()
        });

        await invalidateCacheByPrefix('announcements:list');

        return res.status(200).json({ success: true, code: 'ANNOUNCEMENT_UPDATED', data: announcement });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error updating announcement', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_UPDATE_FAILED' });
    }
};

// DELETE /api/announcements/:announcementId
const deleteAnnouncement = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { announcementId } = validations.announcementIdParamSchema.parse(req.params);

        const announcement = await models.system_announcements.findOne({
            where: { announcement_id: announcementId }
        });

        if (!announcement) {
            return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
        }

        if (!announcement.is_active) {
            return res.status(400).json({ success: false, code: 'ANNOUNCEMENT_ALREADY_INACTIVE' });
        }

        await announcement.update({ is_active: false, updated_by: userId, updated_at: new Date() });

        await invalidateCacheByPrefix('announcements:list');

        return res.status(200).json({ success: true, code: 'ANNOUNCEMENT_DEACTIVATED' });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_URL_PARAM');

        logger.error('Error deactivating announcement', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_DELETE_FAILED' });
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
};
