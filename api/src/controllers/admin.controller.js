const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../services/emailService');
const { moveImageToPermanent } = require('../services/storageService');
const { handleListRequest } = require('../utils/listHelper');
const validations = require('../validations/admin.validation');
const { logger } = require('../utils/logger');

const throwRequestError = (status, message) => {
    const error = new Error(message);
    error.statusCode = status;
    throw error;
};

const ensureReferenceDataExists = async ({
    preferredLangId,
    locationId,
    areas,
    serviceLineId,
    transaction
}) => {
    if (preferredLangId) {
        const preferredLanguage = await models.preferred_lang.findByPk(preferredLangId, { transaction });
        if (!preferredLanguage) throwRequestError(400, 'Invalid preferred_lang_id.');
    }

    if (locationId) {
        const location = await models.locations.findByPk(locationId, { transaction });
        if (!location) throwRequestError(400, 'Invalid location_id.');
    }

    if (serviceLineId) {
        const serviceLine = await models.service_lines.findByPk(serviceLineId, { transaction });
        if (!serviceLine) throwRequestError(400, 'Invalid service_line_id.');
    }

    if (areas?.length) {
        const areaIds = areas.map((area) => area.area_id);
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
            throwRequestError(400, 'One or more selected areas are invalid.');
        }
    }
};

const syncRoleAssignments = async ({
    userId,
    targetRole,
    biography,
    areas,
    serviceLineId,
    locationId,
    isSuperAdmin,
    transaction
}) => {
    if (targetRole !== 'Consultant') {
        await models.consultant_areas.destroy({
            where: { user_id: userId },
            transaction
        });

        await models.consultants.destroy({
            where: { user_id: userId },
            transaction
        });
    }

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
            if (biography !== undefined) {
                await consultant.update({ biography }, { transaction });
            }
        } else {
            await models.consultants.create({
                user_id: userId,
                biography: biography || null
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
    return handleListRequest({
        req,
        res,
        schema: validations.listUsersQuerySchema,
        modelName: 'users',
        cachePrefix: 'admin:users:list',
        include: [
            {
                model: models.locations,
                as: 'location',
                attributes: ['location_id', 'location_name']
            },
            {
                model: models.consultants,
                as: 'consultant',
                attributes: ['biography'],
                include: [
                    {
                        model: models.consultant_areas,
                        as: 'consultant_areas',
                        attributes: ['area_id', 'is_primary'],
                        include: [
                            {
                                model: models.areas,
                                as: 'area',
                                attributes: ['area_id', 'area_name']
                            }
                        ]
                    }
                ]
            },
            {
                model: models.talent_managers,
                as: 'talent_manager',
                attributes: ['biography']
            },
            {
                model: models.service_line_leaders,
                as: 'service_line_leader',
                attributes: ['service_line_id', 'biography'],
                include: [
                    {
                        model: models.service_lines,
                        as: 'service_line',
                        attributes: ['service_line_id', 'service_line_name']
                    }
                ]
            }
        ],
        order: [['created_at', 'DESC']],
        attributes: {
            exclude: ['password_hash']
        }
    });
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
            preferred_lang_id,
            location_id,
            biography,
            areas,
            service_line_id,
            is_super_admin
        } = validatedBody;

        await ensureReferenceDataExists({
            preferredLangId: preferred_lang_id,
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
                message: 'Username or email is already in use.'
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
            preferred_lang_id,
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

        const emailResult = await sendConfirmationEmail(
            newUser.email_address,
            newUser.full_name,
            confirmationToken,
            newUser.preferred_lang_id
        );

        if (!emailResult?.success) {
            logger.error('Admin user creation succeeded but confirmation email failed.', {
                requestId,
                user_id: newUser.user_id,
                email_address: newUser.email_address,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                message: 'User was created, but confirmation e-mail could not be sent. Use the admin reset-password flow to re-send credentials.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: {
                user_id: newUser.user_id,
                full_name: newUser.full_name,
                username: newUser.username,
                email_address: newUser.email_address,
                user_role: newUser.user_role,
                location_id: newUser.location_id,
                preferred_lang_id: newUser.preferred_lang_id,
                is_active: newUser.is_active,
                email_confirmed: newUser.email_confirmed
            }
        });
    } catch (error) {
        if (t) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data.',
                errors: error.issues || error.errors
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        if (error.name === 'StorageMoveError') {
            return res.status(400).json({
                success: false,
                message: 'Profile image URL is invalid and could not be moved.'
            });
        }

        logger.error('Error creating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const updateUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const adminUserId = req.user.sub;
    const t = await sequelize.transaction();

    try {
        const { userId } = validations.userIdParamSchema.parse(req.params);
        const payload = validations.updateUserBodySchema.parse(req.body);

        const user = await models.users.findByPk(userId, {
            include: [
                { model: models.consultants, as: 'consultant', include: [{ model: models.consultant_areas, as: 'consultant_areas' }] },
                { model: models.service_line_leaders, as: 'service_line_leader' }
            ],
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const targetRole = payload.user_role || user.user_role;

        // Prevent promoting any user to Administrator via this endpoint
        if (payload.user_role === 'Administrator' && user.user_role !== 'Administrator') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot change a user\'s role to Administrator. Use the create user flow instead.'
            });
        }

        if (user.user_role === 'Administrator' && payload.user_role && payload.user_role !== 'Administrator') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Administrator users cannot be reassigned to another role.'
            });
        }

        if (payload.areas && targetRole !== 'Consultant') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'areas can only be updated for Consultant users.'
            });
        }

        if (payload.service_line_id && targetRole !== 'Service Line Leader') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'service_line_id can only be updated for Service Line Leader users.'
            });
        }

        if (payload.user_role === 'Consultant' && !payload.areas) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Changing to Consultant requires areas with one primary area.'
            });
        }

        if (payload.user_role === 'Service Line Leader' && !payload.service_line_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Changing to Service Line Leader requires service_line_id.'
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
                                [Op.ne]: userId
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
                    message: 'Username or email is already in use.'
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
                message: 'Service Line Leader users must be linked to a service line.'
            });
        }

        const hasExistingConsultantAreas = Boolean(user.consultant?.consultant_areas?.length);
        if (targetRole === 'Consultant' && !payload.areas && !hasExistingConsultantAreas) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Consultant users must be linked to at least one area with one primary area.'
            });
        }

        await ensureReferenceDataExists({
            preferredLangId: payload.preferred_lang_id,
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
            preferred_lang_id: payload.preferred_lang_id !== undefined ? payload.preferred_lang_id : user.preferred_lang_id,
            location_id: payload.location_id !== undefined ? payload.location_id : user.location_id,
            user_role: targetRole,
            approved_by: payload.approve_member ? adminUserId : user.approved_by
        }, { transaction: t });

        await syncRoleAssignments({
            userId: user.user_id,
            targetRole,
            biography: payload.biography,
            areas: payload.areas,
            serviceLineId: effectiveServiceLineId,
            locationId: payload.location_id,
            transaction: t
        });

        await t.commit();

        return res.status(200).json({
            success: true,
            message: 'User updated successfully.'
        });
    } catch (error) {
        if (t) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data.',
                errors: error.issues || error.errors
            });
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        if (error.name === 'StorageMoveError') {
            return res.status(400).json({
                success: false,
                message: 'Profile image URL is invalid and could not be moved.'
            });
        }

        logger.error('Error updating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const deactivateUser = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;

    try {
        const { userId } = validations.userIdParamSchema.parse(req.params);

        if (req.user.sub === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account.'
            });
        }

        const user = await models.users.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (!user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'User is already inactive.'
            });
        }

        await sequelize.transaction(async (t) => {
            await user.update({ is_active: false }, { transaction: t });
            await models.user_refresh_tokens.destroy({ where: { user_id: userId }, transaction: t });
        });

        // Clear cached profile so /me immediately reflects deactivation
        await redis.del(`user:profile:${userId}`);

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully.'
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL parameter.',
                errors: error.issues || error.errors
            });
        }

        logger.error('Error deactivating user through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

const resetUserPassword = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

    try {
        const { userId } = validations.userIdParamSchema.parse(req.params);

        const user = await models.users.findByPk(userId, {
            attributes: ['user_id', 'full_name', 'email_address', 'preferred_lang_id'],
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'User not found.'
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

        const emailResult = await sendResetPasswordEmail(
            user.email_address,
            user.full_name,
            rawResetToken,
            user.preferred_lang_id
        );

        if (!emailResult?.success) {
            logger.error('Password reset token created but reset e-mail failed to send.', {
                requestId,
                user_id: user.user_id,
                email_address: user.email_address,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                message: 'Password reset request was created, but e-mail could not be sent. Please retry or contact the user directly.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset e-mail sent successfully.'
        });
    } catch (error) {
        if (t) await t.rollback();

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL parameter.',
                errors: error.issues || error.errors
            });
        }

        logger.error('Error forcing password reset through admin module.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deactivateUser,
    resetUserPassword
};
