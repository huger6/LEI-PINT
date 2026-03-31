const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize, models } = require('../config/db');
const { registerSchema } = require('../validations/auth.validation');
const { sendConfirmationEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');
const { moveImageToPermanent } = require('../services/storageService');

const register = async (req, res) => {
    const t = await sequelize.transaction();
    const requestId = req.headers['x-request-id'] || null;

    try {
        logger.info('Register flow started', {
            requestId,
            username: req.body?.username,
            email_address: req.body?.email_address,
            user_role: req.body?.user_role
        });

        // Validate req
        const validatedData = registerSchema.parse(req.body);
        const { password, ...userData } = validatedData;

        logger.debug('Register payload validated', {
            requestId,
            username: userData.username,
            email_address: userData.email_address,
            user_role: userData.user_role
        });

        // Admins are not allowed to register through here
        if (userData.user_role === 'Administrator') {
            logger.warn('Registration rejected due to forbidden role', {
                requestId,
                username: userData.username,
                email_address: userData.email_address,
                user_role: userData.user_role
            });

            return res.status(400).json({
                success: false,
                message: "Administrator is not a valid registration role."
            });
        }

        // Validate if username or email is already in use
        const [existingUser] = await sequelize.query(
            `SELECT user_id, email_address, username
            FROM users
            WHERE email_address=:email OR username=:username
            LIMIT 1`,
            {
                replacements: {
                    email: userData.email_address,
                    username: userData.username
                },
                type: QueryTypes.SELECT
            }
        );

        if (existingUser) {
            await t.rollback();

            logger.warn('Registration conflict: username or email already in use', {
                requestId,
                attemptedUsername: userData.username,
                attemptedEmail: userData.email_address,
                existingUserId: existingUser.user_id
            });

            return res.status(409).json({
                success: false,
                message: "Username or email is already in use."
            });
        }

        // Hash pw
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await models.users.create({
            full_name: userData.full_name,
            username: userData.username,
            email_address: userData.email_address,
            password_hash: passwordHash,
            user_role: userData.user_role,
            phone_number: userData.phone_number,
            birthdate: userData.birthdate,
            profile_img_url: userData.profile_img_url,
            location_id: userData.location_id,
            preferred_lang_id: userData.preferred_lang_id,
            approved_by: null, // Needs to be approved by admin if TM or SLL
            is_active: true,
            email_confirmed: false,
            force_password_change: true
        }, { transaction: t });

        logger.info('Base user record created', {
            requestId,
            user_id: newUser.user_id,
            user_role: userData.user_role
        });

        // Insert on specialized tables
        if (userData.user_role === 'Consultant') {
            await models.consultants.create({
                user_id: newUser.user_id,
                biography: userData.biography
            }, { transaction: t });

            await models.consultant_areas.bulkCreate(
                userData.areas.map((area) => ({
                    user_id: newUser.user_id,
                    area_id: area.area_id,
                    is_primary: area.is_primary
                })),
                { transaction: t }
            );

            logger.debug('Consultant specific records created', {
                requestId,
                user_id: newUser.user_id,
                areasCount: userData.areas.length
            });
        }
        else if (userData.user_role === 'Talent Manager') {
            await models.talent_managers.create({
                user_id: newUser.user_id,
                biography: userData.biography
            }, { transaction: t });

            logger.debug('Talent Manager specific records created', {
                requestId,
                user_id: newUser.user_id
            });
        }
        else if (userData.user_role === 'Service Line Leader') {
            await models.service_line_leaders.create({
                user_id: newUser.user_id,
                service_line_id: userData.service_line_id,
                biography: userData.biography
            }, { transaction: t });

            logger.debug('Service Line Leader specific records created', {
                requestId,
                user_id: newUser.user_id,
                service_line_id: userData.service_line_id
            });
        }

        // Move pfp img to perm folder
        if (userData.profile_img_url) {
            const permanentUrl = await moveImageToPermanent('profiles', userData.profile_img_url, newUser.user_guid);

            await newUser.update({
                profile_img_url: permanentUrl
            }, { transaction: t });
        }

        // Generate email confirmation token
        const tokenValue = crypto.randomBytes(32).toString('hex');
        await models.user_account_tokens.create({
            user_id: newUser.user_id,
            token_value: tokenValue,
            token_type: 'CONFIRMATION',
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h
        }, { transaction: t });

        logger.debug('Confirmation token generated for new user', {
            requestId,
            user_id: newUser.user_id,
            token_type: 'CONFIRMATION'
        });

        // Commit changes
        await t.commit();

        logger.info('Register transaction committed successfully', {
            requestId,
            user_id: newUser.user_id,
            user_role: userData.user_role
        });

        // Send confirmation email
        await sendConfirmationEmail(userData.email_address, userData.full_name, tokenValue, userData.preferred_lang_id);

        logger.info('Confirmation email sent after registration', {
            requestId,
            user_id: newUser.user_id,
            email_address: userData.email_address,
            preferred_lang_id: userData.preferred_lang_id
        });

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully. Please, check your e-mail to confirm the account."
        });
    } catch (error) {
        // DB rollback
        if (t) await t.rollback();

        // Validation error
        if (error.name === 'ZodError') {
            const zodIssues = error.issues || error.errors || [];

            logger.warn('Registration validation failed', {
                requestId,
                issues: zodIssues.map((err) => ({
                    field: Array.isArray(err.path) ? err.path[0] : undefined,
                    code: err.code,
                    message: err.message
                }))
            });

            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: zodIssues.map((err) => ({
                    field: Array.isArray(err.path) ? err.path[0] : undefined,
                    message: err.message
                }))
            });
        }

        // Dups error (more of a failsafe as it is checked above as well)
        if (error.name === 'SequelizeUniqueConstraintError') {
            logger.warn('Registration failed due to unique constraint', {
                requestId,
                error
            });

            return res.status(409).json({
                success: false,
                message: "Username or e-mail is already in use. Please try again with different credentials."
            });
        }

        // Storage error
        if (error.name === 'StorageMoveError') {
            logger.warn('Error storing profile picture.', {
                requestId,
                error
            });

            return res.status(400).json({
                success: false,
                message: "Profile picture URL is invalid and could not be stored properly."
            });
        }

        logger.error('Unexpected error processing registration', {
            requestId,
            error
        });

        return res.status(500).json({
            succes: false,
            message: `Error processing user registration.`
        });
    }
};

const confirmEmail = async (req, res) => {
    const { token } = req.query;
    const requestId = req.headers['x-request-id'] || null;

    try {
        logger.info('Email confirmation flow started', {
            requestId,
            hasToken: Boolean(token)
        });

        const [tokenRecord] = await sequelize.query(
            `SELECT *
            FROM user_account_tokens
            WHERE token_value=:token AND token_type='CONFIRMATION' AND is_used=false
            LIMIT 1`,
            {
                replacements: {
                    token: token,
                },
                type: QueryTypes.SELECT
            }
        );

        // Invalid token
        if (!tokenRecord) {
            logger.warn('Email confirmation failed: invalid or already-used token', {
                requestId
            });

            return res.status(400).json({
                success: false,
                message: "Token is invalid or was already used."
            })
        }
        // Expired token
        else if (new Date() > tokenRecord.expires_at) {
            logger.warn('Email confirmation failed: token expired', {
                requestId,
                token_id: tokenRecord.token_id,
                user_id: tokenRecord.user_id,
                expires_at: tokenRecord.expires_at
            });

            return res.status(410).json({
                success: false,
                message: "Token has expired."
            })
        }

        // Activate account
        await sequelize.transaction(async (t) => {
            await models.users.update(
                { email_confirmed: true },
                {
                    where: {
                        user_id: tokenRecord.user_id
                    }, transaction: t
                }
            );
            // Make sure token isn't used again
            await models.user_account_tokens.update(
                { is_used: true },
                {
                    where: { token_id: tokenRecord.token_id },
                    transaction: t
                }
            );
        });

        logger.info('Email confirmation completed successfully', {
            requestId,
            user_id: tokenRecord.user_id,
            token_id: tokenRecord.token_id
        });

        return res.status(200).json({
            success: true,
            message: "E-mail confirmed. You can now do your first login (remember you will need to change your password)"
        })
    } catch (error) {
        logger.error('Unexpected error confirming email', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error confirming account."
        });
    }
};

module.exports = {
    register,
    confirmEmail
}