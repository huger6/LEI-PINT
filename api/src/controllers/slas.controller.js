const { Op } = require('sequelize');
const { models, sequelize } = require('../config/db');

// Service lines assigned to an SLA (read-only, for the admin UI).
const SLA_SL_INCLUDE = [{
    model: models.service_lines,
    as: 'service_line_id_service_lines_sl_slas',
    attributes: ['service_line_id', 'service_line_name', 'sl_slug'],
    through: { attributes: [] }
}];
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const { invalidateCacheByPrefix } = require('../utils/listHelper');
const validations = require('../validations/slas.validation');
const { handleZodError } = require('../utils/responseHelper');

// GET /api/slas
const getSLAs = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'Administrator';

        const { page, limit, search, isActive, isGlobal, targetProfile } = validations.getSLAsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const cacheKey = `slas:list:${Buffer.from(JSON.stringify({ isActive, isGlobal, targetProfile, search, isAdmin, page, limit })).toString('base64')}`;

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
        if (search) where.sla_name = { [Op.iLike]: `%${search}%` };

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const { rows, count } = await models.slas.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            attributes: { exclude: excludedFields },
            include: SLA_SL_INCLUDE,
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

        logger.error('Error listing SLAs', { error });
        return res.status(500).json({ success: false, code: 'SLA_LIST_FAILED' });
    }
};

// GET /api/slas/:slaId
const getSLAById = async (req, res) => {
    try {
        const { slaId } = validations.slaIdParamSchema.parse(req.params);
        const isAdmin = req.user?.role === 'Administrator';

        const where = {
            sla_id: slaId,
            ...(isAdmin ? {} : { is_active: true })
        };

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const sla = await models.slas.findOne({
            where,
            attributes: { exclude: excludedFields },
            include: SLA_SL_INCLUDE
        });

        if (!sla) {
            return res.status(404).json({ success: false, code: 'SLA_NOT_FOUND' });
        }

        return res.status(200).json({ success: true, data: sla });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_URL_PARAM' });
        }

        logger.error('Error fetching SLA', { error });
        return res.status(500).json({ success: false, code: 'SLA_FETCH_FAILED' });
    }
};

// Validate that all given service line ids exist; returns the deduped list.
const resolveServiceLineIds = async (serviceLineIds, transaction) => {
    const uniqueIds = [...new Set(serviceLineIds)];
    if (uniqueIds.length === 0) return [];
    const found = await models.service_lines.count({
        where: { service_line_id: uniqueIds },
        transaction
    });
    if (found !== uniqueIds.length) {
        const err = new Error('SLA_INVALID_SERVICE_LINES');
        err.code = 'SLA_INVALID_SERVICE_LINES';
        throw err;
    }
    return uniqueIds;
};

// POST /api/slas
const createSLA = async (req, res) => {
    let t;
    try {
        const userId = req.user.sub;

        const {
            slaName,
            responseTimeHours,
            startDate,
            endDate,
            targetProfile,
            isGlobal,
            slaDescription,
            definitionId,
            userId: targetUserId,
            serviceLineIds
        } = validations.createSLABodySchema.parse(req.body);

        t = await sequelize.transaction();

        const newSLA = await models.slas.create({
            sla_name: slaName,
            response_time_hours: responseTimeHours,
            start_date: startDate,
            end_date: endDate,
            target_profile: targetProfile ?? null,
            is_global: isGlobal ?? null,
            sla_description: slaDescription ?? null,
            definition_id: definitionId ?? null,
            user_id: targetUserId ?? null,
            created_by: userId,
            updated_by: userId
        }, { transaction: t });

        if (serviceLineIds && serviceLineIds.length) {
            const ids = await resolveServiceLineIds(serviceLineIds, t);
            await newSLA.setService_line_id_service_lines_sl_slas(ids, { transaction: t });
        }

        await t.commit();
        await invalidateCacheByPrefix('slas:list');

        return res.status(201).json({ success: true, code: 'SLA_CREATED', data: newSLA });

    } catch (error) {
        if (t && !t.finished) { try { await t.rollback(); } catch { /* noop */ } }
        if (error.code === 'SLA_INVALID_SERVICE_LINES') return res.status(400).json({ success: false, code: 'SLA_INVALID_SERVICE_LINES' });
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error creating SLA', { error });
        return res.status(500).json({ success: false, code: 'SLA_CREATE_FAILED' });
    }
};

// PUT /api/slas/:slaId
const updateSLA = async (req, res) => {
    let t;
    try {
        const userId = req.user.sub;
        const { slaId } = validations.slaIdParamSchema.parse(req.params);

        const {
            slaName,
            responseTimeHours,
            startDate,
            endDate,
            targetProfile,
            isGlobal,
            isActive,
            slaDescription,
            definitionId,
            userId: targetUserId,
            serviceLineIds
        } = validations.updateSLABodySchema.parse(req.body);

        const sla = await models.slas.findOne({ where: { sla_id: slaId } });

        if (!sla) {
            return res.status(404).json({ success: false, code: 'SLA_NOT_FOUND' });
        }

        t = await sequelize.transaction();

        await sla.update({
            sla_name: slaName !== undefined ? slaName : sla.sla_name,
            response_time_hours: responseTimeHours !== undefined ? responseTimeHours : sla.response_time_hours,
            start_date: startDate !== undefined ? startDate : sla.start_date,
            end_date: endDate !== undefined ? endDate : sla.end_date,
            target_profile: targetProfile !== undefined ? targetProfile : sla.target_profile,
            is_global: isGlobal !== undefined ? isGlobal : sla.is_global,
            is_active: isActive !== undefined ? isActive : sla.is_active,
            sla_description: slaDescription !== undefined ? slaDescription : sla.sla_description,
            definition_id: definitionId !== undefined ? definitionId : sla.definition_id,
            user_id: targetUserId !== undefined ? targetUserId : sla.user_id,
            updated_by: userId,
            updated_at: new Date()
        }, { transaction: t });

        // Replace the full service-line assignment set when provided ([] clears it).
        if (serviceLineIds !== undefined) {
            const ids = await resolveServiceLineIds(serviceLineIds, t);
            await sla.setService_line_id_service_lines_sl_slas(ids, { transaction: t });
        }

        await t.commit();
        await invalidateCacheByPrefix('slas:list');

        return res.status(200).json({ success: true, code: 'SLA_UPDATED', data: sla });

    } catch (error) {
        if (t && !t.finished) { try { await t.rollback(); } catch { /* noop */ } }
        if (error.code === 'SLA_INVALID_SERVICE_LINES') return res.status(400).json({ success: false, code: 'SLA_INVALID_SERVICE_LINES' });
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error updating SLA', { error });
        return res.status(500).json({ success: false, code: 'SLA_UPDATE_FAILED' });
    }
};

// DELETE /api/slas/:slaId
const deleteSLA = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { slaId } = validations.slaIdParamSchema.parse(req.params);

        const sla = await models.slas.findOne({ where: { sla_id: slaId } });

        if (!sla) {
            return res.status(404).json({ success: false, code: 'SLA_NOT_FOUND' });
        }

        if (!sla.is_active) {
            return res.status(400).json({ success: false, code: 'SLA_ALREADY_INACTIVE' });
        }

        await sla.update({ is_active: false, updated_by: userId, updated_at: new Date() });

        await invalidateCacheByPrefix('slas:list');

        return res.status(200).json({ success: true, code: 'SLA_DEACTIVATED' });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_URL_PARAM');

        logger.error('Error deactivating SLA', { error });
        return res.status(500).json({ success: false, code: 'SLA_DELETE_FAILED' });
    }
};

module.exports = {
    getSLAs,
    getSLAById,
    createSLA,
    updateSLA,
    deleteSLA
};
