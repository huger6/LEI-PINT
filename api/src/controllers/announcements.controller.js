const { Op, literal } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const { invalidateCacheByPrefix } = require('../utils/listHelper');
const validations = require('../validations/announcements.validation');
const { handleZodError } = require('../utils/responseHelper');

const VALID_ROLES = ['Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator'];

async function getUserServiceLineIds(userId, role) {
    if (role === 'Service Line Leader') {
        const sll = await models.service_line_leaders.findOne({
            where: { user_id: userId },
            attributes: ['service_line_id']
        });
        return sll ? [sll.service_line_id] : [];
    }

    if (role === 'Consultant') {
        const areas = await models.consultant_areas.findAll({
            where: { user_id: userId },
            attributes: ['area_id'],
            include: [{
                model: models.areas,
                as: 'area',
                attributes: ['service_line_id']
            }]
        });
        return [...new Set(areas.map(ca => ca.area.service_line_id))];
    }

    return [];
}

// GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'Administrator';

        const { page, limit, search, synced_at, isActive, isGlobal, announcementType } = validations.getAnnouncementsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const cacheParams = { isActive, isGlobal, announcementType, search, isAdmin, page, limit };
        if (!isAdmin && req.user) {
            cacheParams.userId = req.user.sub;
        }
        const cacheKey = `announcements:list:${Buffer.from(JSON.stringify(cacheParams)).toString('base64')}`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, ...JSON.parse(cached) });
        }

        const where = {};
        const now = new Date();

        if (!isAdmin) {
            where.is_active = true;

            where[Op.and] = [
                {
                    [Op.or]: [
                        { starts_at: null },
                        { starts_at: { [Op.lte]: now } }
                    ]
                },
                {
                    [Op.or]: [
                        { ends_at: null },
                        { ends_at: { [Op.gte]: now } }
                    ]
                }
            ];

            if (req.user) {
                const userRole = req.user.role;
                const userSlIds = await getUserServiceLineIds(req.user.sub, userRole);

                const visibilityClauses = [
                    { is_global: true }
                ];

                if (VALID_ROLES.includes(userRole)) {
                    visibilityClauses.push(
                        literal(`EXISTS (SELECT 1 FROM announc_roles ar WHERE ar.announcement_id = "system_announcements".announcement_id AND ar.role_name = '${userRole}')`)
                    );
                }

                if (userSlIds.length > 0) {
                    visibilityClauses.push(
                        literal(`EXISTS (SELECT 1 FROM announc_sl asl WHERE asl.announcement_id = "system_announcements".announcement_id AND asl.service_line_id IN (${userSlIds.join(',')}))`)
                    );
                }

                where[Op.and].push({ [Op.or]: visibilityClauses });
            } else {
                where.is_global = true;
            }
        } else {
            if (isActive !== undefined) where.is_active = isActive;
        }

        if (isGlobal !== undefined) where.is_global = isGlobal;
        if (announcementType) where.announcement_type = announcementType;
        if (search) where.announcement_title = { [Op.iLike]: `%${search}%` };
        if (synced_at) where.updated_at = { [Op.gt]: synced_at };

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const includeConfig = [];
        if (isAdmin) {
            includeConfig.push(
                { model: models.announc_roles, as: 'announc_roles', attributes: ['role_name'] },
                {
                    model: models.announc_sl, as: 'announc_sls', attributes: ['service_line_id'],
                    include: [{ model: models.service_lines, as: 'service_line', attributes: ['service_line_id', 'service_line_name'] }]
                }
            );
        }

        if (synced_at) {
            const rows = await models.system_announcements.findAll({
                where,
                order: [['created_at', 'DESC']],
                attributes: { exclude: excludedFields },
                include: includeConfig
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: { totalItems: rows.length, totalPages: 1, currentPage: 1 }
            });
        }

        const { rows, count } = await models.system_announcements.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: { exclude: excludedFields },
            include: includeConfig,
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
        const now = new Date();

        const where = { announcement_id: announcementId };

        if (!isAdmin) {
            where.is_active = true;
            where[Op.and] = [
                { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: now } }] },
                { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: now } }] }
            ];
        }

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const announcement = await models.system_announcements.findOne({
            where,
            attributes: { exclude: excludedFields },
            include: [
                { model: models.announc_roles, as: 'announc_roles', attributes: ['role_name'] },
                { model: models.announc_sl, as: 'announc_sls', attributes: ['service_line_id'] }
            ]
        });

        if (!announcement) {
            return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
        }

        if (!isAdmin) {
            const isGlobal = announcement.is_global;

            if (!isGlobal) {
                const userRole = req.user.role;
                const userSlIds = await getUserServiceLineIds(req.user.sub, userRole);

                const roleNames = announcement.announc_roles.map(r => r.role_name);
                const slIds = announcement.announc_sls.map(s => s.service_line_id);

                const roleMatch = roleNames.includes(userRole);
                const slMatch = userSlIds.some(id => slIds.includes(id));

                if (!roleMatch && !slMatch) {
                    return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
                }
            }
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
            isGlobal,
            roleNames,
            serviceLineIds
        } = validations.createAnnouncementBodySchema.parse(req.body);

        const result = await sequelize.transaction(async (t) => {
            const newAnnouncement = await models.system_announcements.create({
                announcement_title: announcementTitle,
                announcement_message: announcementMessage,
                starts_at: startsAt ?? null,
                ends_at: endsAt ?? null,
                announcement_type: announcementType ?? null,
                is_global: isGlobal ?? false,
                created_by: userId,
                updated_by: userId
            }, { transaction: t });

            const announcementId = newAnnouncement.announcement_id;

            if (roleNames && roleNames.length > 0) {
                await models.announc_roles.bulkCreate(
                    roleNames.map(rn => ({ announcement_id: announcementId, role_name: rn })),
                    { transaction: t }
                );
            }

            if (serviceLineIds && serviceLineIds.length > 0) {
                await models.announc_sl.bulkCreate(
                    serviceLineIds.map(slId => ({ announcement_id: announcementId, service_line_id: slId })),
                    { transaction: t }
                );
            }

            return newAnnouncement;
        });

        await invalidateCacheByPrefix('announcements:list');

        return res.status(201).json({ success: true, code: 'ANNOUNCEMENT_CREATED', data: result });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error creating announcement', { error });
        return res.status(500).json({ success: false, code: 'ANNOUNCEMENT_CREATE_FAILED' });
    }
};

// PUT /api/announcements/:announcementId
const updateAnnouncement = async (req, res) => {
    try {
        const adminUserId = req.user.sub;
        const { announcementId } = validations.announcementIdParamSchema.parse(req.params);

        const {
            announcementTitle,
            announcementMessage,
            startsAt,
            endsAt,
            announcementType,
            isGlobal,
            isActive,
            roleNames,
            serviceLineIds
        } = validations.updateAnnouncementBodySchema.parse(req.body);

        const result = await sequelize.transaction(async (t) => {
            const announcement = await models.system_announcements.findOne({
                where: { announcement_id: announcementId },
                transaction: t
            });

            if (!announcement) {
                const err = new Error('NOT_FOUND');
                err.statusCode = 404;
                throw err;
            }

            await announcement.update({
                announcement_title: announcementTitle !== undefined ? announcementTitle : announcement.announcement_title,
                announcement_message: announcementMessage !== undefined ? announcementMessage : announcement.announcement_message,
                starts_at: startsAt !== undefined ? startsAt : announcement.starts_at,
                ends_at: endsAt !== undefined ? endsAt : announcement.ends_at,
                announcement_type: announcementType !== undefined ? announcementType : announcement.announcement_type,
                is_global: isGlobal !== undefined ? isGlobal : announcement.is_global,
                is_active: isActive !== undefined ? isActive : announcement.is_active,
                updated_by: adminUserId,
                updated_at: new Date()
            }, { transaction: t });

            if (roleNames !== undefined) {
                await models.announc_roles.destroy({
                    where: { announcement_id: announcementId },
                    transaction: t
                });
                if (roleNames.length > 0) {
                    await models.announc_roles.bulkCreate(
                        roleNames.map(rn => ({ announcement_id: announcementId, role_name: rn })),
                        { transaction: t }
                    );
                }
            }

            if (serviceLineIds !== undefined) {
                await models.announc_sl.destroy({
                    where: { announcement_id: announcementId },
                    transaction: t
                });
                if (serviceLineIds.length > 0) {
                    await models.announc_sl.bulkCreate(
                        serviceLineIds.map(slId => ({ announcement_id: announcementId, service_line_id: slId })),
                        { transaction: t }
                    );
                }
            }

            return announcement;
        });

        await invalidateCacheByPrefix('announcements:list');

        return res.status(200).json({ success: true, code: 'ANNOUNCEMENT_UPDATED', data: result });

    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ success: false, code: 'ANNOUNCEMENT_NOT_FOUND' });
        }
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
