const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../services/email.service');
const { moveImageToPermanent } = require('../services/storage.service');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const validations = require('../validations/admin.validation');
const { logger } = require('../utils/logger');
const { sendTopicUpdate } = require('../services/firebase.service');

const throwRequestError = (status, code) => {
    const error = new Error(code);
    error.statusCode = status;
    throw error;
};

const ensureReferenceDataExists = async ({
    languageId,
    locationId,
    areas,
    serviceLineId,
    transaction
}) => {
    if (languageId) {
        const language = await models.languages.findByPk(languageId, { transaction });
        if (!language) throwRequestError(400, 'ADMIN_INVALID_LANG_ID');
    }

    if (locationId) {
        const location = await models.locations.findByPk(locationId, { transaction });
        if (!location) throwRequestError(400, 'ADMIN_INVALID_LOCATION_ID');
    }

    if (serviceLineId) {
        const serviceLine = await models.service_lines.findByPk(serviceLineId, { transaction });
        if (!serviceLine) throwRequestError(400, 'ADMIN_INVALID_SERVICE_LINE_ID');
    }

    if (areas?.length) {
        const areaIds = [...new Set(areas.map((area) => area.area_id))];
        const availableAreas = await models.areas.findAll({
            attributes: ['area_id'],
            where: {
                area_id: {
                    [Op.in]: areaIds
                }
            },
            transaction
        });

        if (availableAreas.length !== areaIds.length) {
            throwRequestError(400, 'ADMIN_INVALID_AREAS');
        }
    }
};

const syncRoleAssignments = async ({
    userId,
    targetRole,
    biography,
    gdprAccepted,
    areas,
    serviceLineId,
    locationId,
    isSuperAdmin,
    transaction
}) => {
    // Consultant rows are intentionally preserved on role change (FK children
    // with ON DELETE RESTRICT prevent deletion, and domain rules require points
    // to be permanently preserved). Query hardening ensures orphaned rows are
    // invisible to business logic.

    if (targetRole !== 'Talent Manager') {
        await models.talent_managers.destroy({
            where: { user_id: userId },
            transaction
        });
    }

    if (targetRole !== 'Service Line Leader') {
        await models.service_line_leaders.destroy({
            where: { user_id: userId },
            transaction
        });
    }

    if (targetRole === 'Consultant') {
        const consultant = await models.consultants.findByPk(userId, { transaction });

        if (consultant) {
            const updateFields = {};
            if (biography !== undefined) updateFields.biography = biography;
            if (gdprAccepted !== undefined) updateFields.gdpr_accepted = gdprAccepted;
            if (Object.keys(updateFields).length > 0) {
                await consultant.update(updateFields, { transaction });
            }
        } else {
            await models.consultants.create({
                user_id: userId,
                biography: biography || null,
                gdpr_accepted: gdprAccepted !== undefined ? gdprAccepted : false
            }, { transaction });
        }

        if (areas) {
            await models.consultant_areas.destroy({
                where: { user_id: userId },
                transaction
            });

            await models.consultant_areas.bulkCreate(
                areas.map((area) => ({
                    user_id: userId,
                    area_id: area.area_id,
                    is_primary: area.is_primary
                })),
                { transaction }
            );
        }
    }

    if (targetRole === 'Talent Manager') {
        const talentManager = await models.talent_managers.findByPk(userId, { transaction });

        if (talentManager) {
            if (biography !== undefined) {
                await talentManager.update({ biography }, { transaction });
            }
        } else {
            await models.talent_managers.create({
                user_id: userId,
                biography: biography || null
            }, { transaction });
        }
    }

    if (targetRole === 'Service Line Leader') {
        const sll = await models.service_line_leaders.findByPk(userId, { transaction });

        if (sll) {
            await sll.update({
                service_line_id: serviceLineId !== undefined ? serviceLineId : sll.service_line_id,
                biography: biography !== undefined ? biography : sll.biography
            }, { transaction });
        } else {
            await models.service_line_leaders.create({
                user_id: userId,
                service_line_id: serviceLineId,
                biography: biography || null
            }, { transaction });
        }
    }

    if (targetRole === 'Administrator') {
        const admin = await models.administrators.findByPk(userId, { transaction });

        if (admin) {
            await admin.update({
                location_id: locationId !== undefined ? locationId : admin.location_id
            }, { transaction });
        } else {
            await models.administrators.create({
                user_id: userId,
                is_super_admin: Boolean(isSuperAdmin),
                location_id: locationId || null
            }, { transaction });
        }
    }
};

const getUsers = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    const queryValidation = validations.listUsersQuerySchema.safeParse(req.query);
    if (!queryValidation.success) return res.status(400).json({
        success: false,
        errors: queryValidation.error.issues
    });

    const { page, limit, ...filterParams } = queryValidation.data;
    const offset = (page - 1) * limit;
    const cacheKey = `admin:users:list:${Buffer.from(JSON.stringify({ ...filterParams, page, limit })).toString('base64')}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, ...JSON.parse(cached) });

        const { where, include } = models.users.buildUserFilter(filterParams, models);

        const { rows, count } = await models.users.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true,
            attributes: { exclude: ['password_hash'] }
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
        logger.error('Error in admin:users:list', { requestId, error });
        return res.status(500).json({ success: false, code: 'LIST_FETCH_FAILED' });
    }
};

const getUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    const paramValidation = validations.userIdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
        return res.status(400).json({ success: false, errors: paramValidation.error.issues });
    }

    const { userGuid } = paramValidation.data;

    try {
        const user = await models.users.findOne({
            where: /^\d+$/.test(userGuid)
                ? { user_id: Number(userGuid) }
                : { user_guid: userGuid },
            attributes: [
                'user_id', 'user_guid', 'full_name', 'username',
                'email_address', 'user_role', 'profile_img_url',
                'language_id', 'location_id', 'current_streak_days',
                'is_active', 'email_confirmed', 'last_login_at',
                'last_online', 'created_at'
            ],
            raw: true
        });

        if (!user) {
            return res.status(404).json({ success: false, code: 'ADMIN_USER_NOT_FOUND' });
        }

        const [location, languageRecord, consultant, talentManager, serviceLineLeader, consultantAreas] = await Promise.all([
            user.location_id
                ? models.locations.findByPk(user.location_id, { attributes: ['location_id', 'location_name'], raw: true })
                : null,
            user.language_id
                ? models.languages.findByPk(user.language_id, { attributes: ['language_id', 'language_iso', 'language_name'], raw: true })
                : null,
            models.consultants.findOne({ where: { user_id: user.user_id }, attributes: ['biography', 'gdpr_accepted'], raw: true }),
            models.talent_managers.findOne({ where: { user_id: user.user_id }, attributes: ['biography'], raw: true }),
            models.service_line_leaders.findOne({ where: { user_id: user.user_id }, attributes: ['biography', 'service_line_id'], raw: true }),
            models.consultant_areas.findAll({ where: { user_id: user.user_id }, attributes: ['area_id', 'is_primary'], raw: true })
        ]);

        let areasPayload = null;
        if (consultantAreas.length > 0) {
            const areaIds = consultantAreas.map((a) => a.area_id);
            const areaRecords = await models.areas.findAll({
                where: { area_id: { [Op.in]: areaIds } },
                attributes: ['area_id', 'area_name', 'area_slug', 'area_code', 'area_description', 'img_url'],
                raw: true
            });
            const areaById = new Map(areaRecords.map((a) => [a.area_id, a]));
            areasPayload = consultantAreas
                .map((ca) => {
                    const area = areaById.get(ca.area_id);
                    if (!area) return null;
                    return { areaId: area.area_id, name: area.area_name, slug: area.area_slug, code: area.area_code, description: area.area_description, imgUrl: area.img_url, isPrimary: ca.is_primary };
                })
                .filter(Boolean);
            if (areasPayload.length === 0) areasPayload = null;
        }

        let serviceLineData = null;
        let learningPathData = null;

        const resolveServiceLine = async (serviceLineId) => {
            if (!serviceLineId) return;
            const sl = await models.service_lines.findByPk(serviceLineId, {
                attributes: ['service_line_name', 'sl_slug', 'service_line_description', 'img_url', 'learning_path_id'],
                raw: true
            });
            if (!sl) return;
            serviceLineData = { serviceLineId: serviceLineId, name: sl.service_line_name, slug: sl.sl_slug, description: sl.service_line_description, imgUrl: sl.img_url };
            if (sl.learning_path_id) {
                const lp = await models.learning_paths.findByPk(sl.learning_path_id, {
                    attributes: ['path_title', 'path_slug', 'path_description', 'img_url'],
                    raw: true
                });
                if (lp) learningPathData = { title: lp.path_title, slug: lp.path_slug, description: lp.path_description, imgUrl: lp.img_url };
            }
        };

        if (serviceLineLeader?.service_line_id) {
            await resolveServiceLine(serviceLineLeader.service_line_id);
        } else if (consultantAreas.length > 0) {
            const primaryArea = consultantAreas.find((a) => a.is_primary);
            if (primaryArea) {
                const areaWithSl = await models.areas.findByPk(primaryArea.area_id, { attributes: ['service_line_id'], raw: true });
                await resolveServiceLine(areaWithSl?.service_line_id);
            }
        }

        const langPayload = languageRecord
            ? { id: languageRecord.language_id, iso: languageRecord.language_iso, name: languageRecord.language_name }
            : null;

        const profile = {
            guid: user.user_guid,
            fullName: user.full_name,
            username: user.username,
            email: user.email_address,
            role: user.user_role,
            profileImg: user.profile_img_url,
            lang: langPayload,
            location: location ? { location_id: location.location_id, name: location.location_name } : null,
            locationId: user.location_id,
            biography: user.user_role === 'Consultant' ? (consultant?.biography || null)
                : user.user_role === 'Talent Manager' ? (talentManager?.biography || null)
                : user.user_role === 'Service Line Leader' ? (serviceLineLeader?.biography || null)
                : null,
            serviceLineId: serviceLineLeader?.service_line_id || null,
            serviceLine: serviceLineData,
            learningPath: learningPathData,
            areas: areasPayload,
            currentStreakDays: user.current_streak_days,
            isActive: user.is_active,
            emailConfirmed: user.email_confirmed,
            gdprAccepted: consultant?.gdpr_accepted ?? null,
            lastLogin: user.last_login_at,
            lastOnline: user.last_online,
            createdAt: user.created_at
        };

        return res.status(200).json({ success: true, code: 'ADMIN_USER_PROFILE_RETRIEVED', data: profile });
    } catch (error) {
        logger.error('Error fetching user profile (admin)', { requestId, userGuid, error });
        return res.status(500).json({ success: false, code: 'ADMIN_USER_FETCH_FAILED' });
    }
};

const resolveUserParam = async (param, transaction) => {
    // param may be numeric id or uuid
    if (!param) return null;

    if (/^\d+$/.test(param)) {
        return models.users.findOne({ where: { user_id: Number(param) }, transaction });
    }

    return models.users.findOne({ where: { user_guid: param }, transaction });
};

const createUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const adminUserId = req.user.sub;
    const t = await sequelize.transaction();

    try {
        const validatedBody = validations.createUserBodySchema.parse(req.body);

        const {
            full_name,
            username,
            email_address,
            password,
            user_role,
            phone_number,
            birthdate,
            profile_img_url,
            language_id,
            location_id,
            biography,
            areas,
            service_line_id,
            is_super_admin
        } = validatedBody;

        await ensureReferenceDataExists({
            languageId: language_id,
            locationId: location_id,
            areas,
            serviceLineId: service_line_id,
            transaction: t
        });

        const existingUser = await models.users.findOne({
            attributes: ['user_id'],
            where: {
                [Op.or]: [
                    { username },
                    { email_address }
                ]
            },
            transaction: t
        });

        if (existingUser) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                code: 'AUTH_CREDENTIALS_CONFLICT'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await models.users.create({
            full_name,
            username,
            email_address,
            password_hash: passwordHash,
            user_role,
            phone_number: phone_number || null,
            birthdate: birthdate || null,
            profile_img_url: profile_img_url || null,
            language_id,
            location_id: location_id || null,
            approved_by: adminUserId,
            is_active: true,
            email_confirmed: false,
            force_password_change: true
        }, { transaction: t });

        await syncRoleAssignments({
            userId: newUser.user_id,
            targetRole: user_role,
            biography,
            areas,
            serviceLineId: service_line_id,
            locationId: location_id,
            isSuperAdmin: is_super_admin,
            transaction: t
        });

        if (profile_img_url && profile_img_url.includes('/temp/')) {
            const permanentUrl = await moveImageToPermanent(
                'profiles',
                profile_img_url,
                newUser.user_guid
            );

            await newUser.update({
                profile_img_url: permanentUrl
            }, { transaction: t });
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const confirmationTokenHash = crypto.createHash('sha256').update(confirmationToken).digest('hex');
        await models.user_account_tokens.create({
            user_id: newUser.user_id,
            token_value: confirmationTokenHash,
            token_type: 'CONFIRMATION',
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
            is_used: false
        }, { transaction: t });

        await t.commit();

        await invalidateCacheByPrefix('admin:users:list');
        await invalidateCacheByPrefix('lp:list');
        await redis.del('lp:filter-stats');
        await invalidateCacheByPrefix('sl:list');
        await redis.del('sl:filter-stats');
        await invalidateCacheByPrefix('areas:list');
        await redis.del('areas:filter-stats');
        await invalidateCacheByPrefix('levels:list');
        await redis.del('levels:filter-stats');
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 7);
        if (user_role === 'Consultant') {
            await sendTopicUpdate("new_data", 2);
            await sendTopicUpdate("new_data", 3);
        } else if (user_role === 'Talent Manager') {
            await sendTopicUpdate("new_data", 4);
        } else if (user_role === 'Service Line Leader') {
            await sendTopicUpdate("new_data", 5);
        } else if (user_role === 'Administrator') {
            await sendTopicUpdate("new_data", 6);
        }

        const emailResult = await sendConfirmationEmail(
            newUser.email_address,
            newUser.full_name,
            confirmationToken,
            newUser.language_id
        );

        if (!emailResult?.success) {
            logger.error('Admin user creation succeeded but confirmation email failed.', {
                requestId,
                user_id: newUser.user_id,
                email_address: newUser.email_address,
                emailError: emailResult?.error
            });

            return res.status(201).json({
                success: true,
                code: 'ADMIN_USER_CREATE_EMAIL_FAILED',
                data: {
                    user_guid: newUser.user_guid,
                    full_name: newUser.full_name,
                    username: newUser.username,
                    email_address: newUser.email_address,
                    user_role: newUser.user_role,
                    location_id: newUser.location_id,
                    language_id: newUser.language_id,
                    is_active: newUser.is_active,
                    email_confirmed: newUser.email_confirmed
                }
            });
        }

        return res.status(201).json({
            success: true,
            code: 'ADMIN_USER_CREATED',
            data: {
                user_guid: newUser.user_guid,
                full_name: newUser.full_name,
                username: newUser.username,
                email_address: newUser.email_address,
                user_role: newUser.user_role,
                location_id: newUser.location_id,
                language_id: newUser.language_id,
                is_active: newUser.is_active,
                email_confirmed: newUser.email_confirmed
            }
        });
    } catch (error) {
        if (t && !t.finished) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.issues || error.errors
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                code: error.message
            });
        }

        if (error.name === 'StorageMoveError') {
            return res.status(400).json({
                success: false,
                code: 'ADMIN_PROFILE_IMAGE_MOVE_FAILED'
            });
        }

        logger.error('Error creating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            code: 'ADMIN_USER_CREATE_FAILED'
        });
    }
};

const updateUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const adminUserId = req.user.sub;
    const t = await sequelize.transaction();

    try {
        const { userGuid } = validations.userIdParamSchema.parse(req.params);
        const payload = validations.updateUserBodySchema.parse(req.body);

        // Resolve by numeric id or guid
        let user = await resolveUserParam(userGuid, t);
        if (user) {
            await user.reload({
                include: [
                    { model: models.consultants, as: 'consultant', include: [{ model: models.consultant_areas, as: 'consultant_areas' }] },
                    { model: models.service_line_leaders, as: 'service_line_leader' }
                ],
                transaction: t
            });
        }

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                code: 'ADMIN_USER_NOT_FOUND'
            });
        }

        const targetRole = payload.user_role || user.user_role;

        if (user.user_role === 'Administrator' && payload.user_role && payload.user_role !== 'Administrator') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_CANNOT_DEMOTE_ADMIN'
            });
        }

        if (payload.user_role === 'Administrator' && user.user_role !== 'Administrator') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_CANNOT_PROMOTE_TO_ADMIN'
            });
        }

        if (payload.areas && targetRole !== 'Consultant') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_AREAS_CONSULTANT_ONLY'
            });
        }

        if (payload.service_line_id && targetRole !== 'Service Line Leader') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_SERVICE_LINE_SLL_ONLY'
            });
        }



        const shouldCheckUniqueFields = payload.username || payload.email_address;
        if (shouldCheckUniqueFields) {
            const duplicatedUser = await models.users.findOne({
                attributes: ['user_id'],
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                ...(payload.username ? [{ username: payload.username }] : []),
                                ...(payload.email_address ? [{ email_address: payload.email_address }] : [])
                            ]
                        },
                        {
                            user_id: {
                                [Op.ne]: user.user_id
                            }
                        }
                    ]
                },
                transaction: t
            });

            if (duplicatedUser) {
                await t.rollback();
                return res.status(409).json({
                    success: false,
                    code: 'AUTH_CREDENTIALS_CONFLICT'
                });
            }
        }

        const effectiveServiceLineId = targetRole === 'Service Line Leader'
            ? (payload.service_line_id !== undefined
                ? payload.service_line_id
                : user.service_line_leader?.service_line_id)
            : undefined;

        if (targetRole === 'Service Line Leader' && !effectiveServiceLineId) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_SLL_NO_SERVICE_LINE'
            });
        }

        let lastSllWarning = false;
        if (user.user_role === 'Service Line Leader' && payload.user_role && payload.user_role !== 'Service Line Leader') {
            const currentSll = await models.service_line_leaders.findByPk(user.user_id, { transaction: t });
            if (currentSll) {
                const sllCount = await models.service_line_leaders.count({
                    where: { service_line_id: currentSll.service_line_id },
                    transaction: t
                });
                if (sllCount <= 1) lastSllWarning = true;
            }
        }

        const hasExistingConsultantAreas = Boolean(user.consultant?.consultant_areas?.length);
        if (targetRole === 'Consultant' && !payload.areas && !hasExistingConsultantAreas) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: 'ADMIN_CONSULTANT_NO_AREAS'
            });
        }

        await ensureReferenceDataExists({
            languageId: payload.language_id,
            locationId: payload.location_id,
            areas: payload.areas,
            serviceLineId: effectiveServiceLineId,
            transaction: t
        });

        let finalProfileImage = user.profile_img_url;
        if (payload.profile_img_url && payload.profile_img_url.includes('/temp/')) {
            finalProfileImage = await moveImageToPermanent('profiles', payload.profile_img_url, user.user_guid);
        } else if (payload.profile_img_url !== undefined) {
            finalProfileImage = payload.profile_img_url;
        }

        await user.update({
            full_name: payload.full_name !== undefined ? payload.full_name : user.full_name,
            username: payload.username !== undefined ? payload.username : user.username,
            email_address: payload.email_address !== undefined ? payload.email_address : user.email_address,
            phone_number: payload.phone_number !== undefined ? payload.phone_number : user.phone_number,
            birthdate: payload.birthdate !== undefined ? payload.birthdate : user.birthdate,
            profile_img_url: finalProfileImage,
            language_id: payload.language_id !== undefined ? payload.language_id : user.language_id,
            location_id: payload.location_id !== undefined ? payload.location_id : user.location_id,
            user_role: targetRole,
            email_confirmed: payload.email_confirmed !== undefined ? payload.email_confirmed : user.email_confirmed,
            is_active: payload.approve_member !== undefined ? payload.approve_member : user.is_active,
            approved_by: payload.approve_member === true ? adminUserId : user.approved_by
        }, { transaction: t });

        await syncRoleAssignments({
            userId: user.user_id,
            targetRole,
            biography: payload.biography,
            gdprAccepted: payload.gdpr_accepted,
            areas: payload.areas,
            serviceLineId: effectiveServiceLineId,
            locationId: payload.location_id,
            transaction: t
        });

        await t.commit();

        await Promise.all([
            invalidateCacheByPrefix('admin:users:list'),
            redis.del(`user:profile:${user.user_id}`),
            invalidateCacheByPrefix('lp:list'),
            redis.del('lp:filter-stats'),
            invalidateCacheByPrefix('sl:list'),
            redis.del('sl:filter-stats'),
            invalidateCacheByPrefix('areas:list'),
            redis.del('areas:filter-stats'),
            invalidateCacheByPrefix('levels:list'),
            redis.del('levels:filter-stats'),
        ]);
        await sendTopicUpdate("new_data", 1);
        if (targetRole === 'Consultant') {
            await sendTopicUpdate("new_data", 2);
            await sendTopicUpdate("new_data", 3);
        } else if (targetRole === 'Talent Manager') {
            await sendTopicUpdate("new_data", 4);
        } else if (targetRole === 'Service Line Leader') {
            await sendTopicUpdate("new_data", 5);
        } else if (targetRole === 'Administrator') {
            await sendTopicUpdate("new_data", 6);
        }

        return res.status(200).json({
            success: true,
            code: 'ADMIN_USER_UPDATED',
            ...(lastSllWarning && { warning: 'ADMIN_SLL_LAST_LEADER_WARNING' })
        });
    } catch (error) {
        if (t && !t.finished) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.issues || error.errors
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                code: error.message
            });
        }

        if (error.name === 'StorageMoveError') {
            return res.status(400).json({
                success: false,
                code: 'ADMIN_PROFILE_IMAGE_MOVE_FAILED'
            });
        }

        logger.error('Error updating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            code: 'ADMIN_USER_UPDATE_FAILED'
        });
    }
};

const deactivateUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    try {
        const { userGuid } = validations.userIdParamSchema.parse(req.params);

        const user = await resolveUserParam(userGuid);

        if (!user) {
            return res.status(404).json({
                success: false,
                code: 'ADMIN_USER_NOT_FOUND'
            });
        }

        if (req.user.sub === user.user_id) {
            return res.status(400).json({
                success: false,
                code: 'ADMIN_CANNOT_DEACTIVATE_SELF'
            });
        }

        if (!user.is_active) {
            return res.status(400).json({
                success: false,
                code: 'ADMIN_USER_ALREADY_INACTIVE'
            });
        }

        await sequelize.transaction(async (t) => {
            await user.update({ is_active: false }, { transaction: t });
            await models.user_refresh_tokens.destroy({ where: { user_id: user.user_id }, transaction: t });
        });

        await Promise.all([
            redis.del(`user:profile:${user.user_id}`),
            invalidateCacheByPrefix('admin:users:list'),
            invalidateCacheByPrefix('lp:list'),
            redis.del('lp:filter-stats'),
            invalidateCacheByPrefix('sl:list'),
            redis.del('sl:filter-stats'),
            invalidateCacheByPrefix('areas:list'),
            redis.del('areas:filter-stats'),
            invalidateCacheByPrefix('levels:list'),
            redis.del('levels:filter-stats'),
        ]);
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 8);

        return res.status(200).json({
            success: true,
            code: 'ADMIN_USER_DEACTIVATED'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_URL_PARAM',
                errors: error.issues || error.errors
            });
        }

        logger.error('Error deactivating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            code: 'ADMIN_USER_DEACTIVATE_FAILED'
        });
    }
};

const resetUserPassword = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

    try {
        const { userGuid } = validations.userIdParamSchema.parse(req.params);

        const user = await resolveUserParam(userGuid, t);


        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                code: 'ADMIN_USER_NOT_FOUND'
            });
        }

        const rawResetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const existingResetToken = await models.user_account_tokens.findOne({
            where: {
                user_id: user.user_id,
                token_type: 'PASSWORD_RESET'
            },
            transaction: t
        });

        if (existingResetToken) {
            await existingResetToken.update({
                token_value: tokenHash,
                expires_at: expiresAt,
                is_used: false
            }, { transaction: t });
        } else {
            await models.user_account_tokens.create({
                user_id: user.user_id,
                token_value: tokenHash,
                token_type: 'PASSWORD_RESET',
                expires_at: expiresAt,
                is_used: false
            }, { transaction: t });
        }

        await models.users.update(
            {
                force_password_change: true
            },
            {
                where: { user_id: user.user_id },
                transaction: t
            }
        );

        await t.commit();
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 7);

        const emailResult = await sendResetPasswordEmail(
            user.email_address,
            user.full_name,
            rawResetToken,
            user.language_id
        );

        if (!emailResult?.success) {
            logger.error('Password reset token created but reset e-mail failed to send.', {
                requestId,
                user_id: user.user_id,
                email_address: user.email_address,
                emailError: emailResult?.error
            });

            return res.status(200).json({
                success: true,
                code: 'ADMIN_PASSWORD_RESET_EMAIL_FAILED'
            });
        }

        return res.status(200).json({
            success: true,
            code: 'ADMIN_PASSWORD_RESET_EMAIL_SENT'
        });
    } catch (error) {
        if (t && !t.finished) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_URL_PARAM',
                errors: error.issues || error.errors
            });
        }

        logger.error('Error forcing password reset through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            code: 'ADMIN_PASSWORD_RESET_FAILED'
        });
    }
};

const getSllCount = async (req, res) => {
    try {
        const serviceLineId = Number(req.params.serviceLineId);
        if (!Number.isInteger(serviceLineId) || serviceLineId <= 0) {
            return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_URL_PARAM' });
        }
        const count = await models.service_line_leaders.count({
            where: { service_line_id: serviceLineId },
            include: [{ model: models.users, as: 'user', attributes: [], where: { user_role: 'Service Line Leader' } }]
        });
        return res.status(200).json({ success: true, data: { count } });
    } catch (error) {
        logger.error('Error counting SLLs for service line.', { error });
        return res.status(500).json({ success: false, code: 'ADMIN_SLL_COUNT_FAILED' });
    }
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deactivateUser,
    resetUserPassword,
    getSllCount
};
