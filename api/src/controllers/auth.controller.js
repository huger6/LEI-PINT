const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize, models } = require('../config/db');
const { emailRule, passwordRule, registerSchema, loginSchema } = require('../validations/auth.validation');
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

const login = async (req, res) => {
    const t = await sequelize.transaction();
    const requestId = req.headers['x-request-id'] || null;

    try {
        const { identifier, password, remember } = loginSchema.parse(req.body);

        // Identift it is email or username
        const isEmail = emailRule.safeParse(identifier).success;

        const searchCriteria = isEmail ? { email_address: identifier } : { username: identifier };

        logger.info(`Login attempt identified as ${isEmail ? 'email' : 'username'}`, {
            requestId,
            identifier
        });

        const user = await models.users.findOne({ where: searchCriteria });

        if (!user) {
            await t.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid credentials.", // This is intentional
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            await t.rollback();

            logger.warn('Failed login attempt: wrong password.', {
                requestId,
                identifier
            });
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Check if user has confirmed it's email
        if (!user.email_confirmed) {
            await t.rollback();

            logger.warn('Failed login attempt: e-mail address is not confirmed.', {
                requestId,
                identifier
            });
            return res.status(403).json({
                success: false,
                message: "Please validate your e-mail address first."
            });
        }

        // User first login is handled below as we pass force_password_change

        // JWT 
        const payload = {
            sub: user.user_id,
            guid: user.user_guid,
            role: user.user_role,
            username: user.username,
            fpc: user.force_password_change
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

        // Generate Refresh Token (to maintain session)
        const refreshTokenDurationDays = remember ? 30 : 0.35; // 1/3 de dia
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (refreshTokenDurationDays * 24));

        const refreshTokenValue = crypto.randomBytes(40).toString('hex');

        await models.user_refresh_tokens.create({
            user_id: user.user_id,
            token_value: refreshTokenValue,
            expires_at: expiresAt
        }, { transaction: t });

        // Update last login date
        await user.update({
            last_login_at: new Date(),
            last_online: new Date()
        }, { transaction: t });

        await t.commit();

        // Send refreshToken via httpOnly cookie (secure)
        res.cookie('refreshToken', refreshTokenValue, {
            httpOnly: true,
            secure: false, // IMPORTANT: CHANGE THIS WHEN IN PRODUCTION
            sameSite: 'Strict',
            path: '/api/auth', // Cookie is only sent to /auth prefixed routes
            maxAge: refreshTokenDurationDays * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: user.force_password_change ? "Password change required" : "Login successful.",
            data: {
                token: accessToken,
                fpc: user.force_password_change,
                user: {
                    full_name: user.full_name,
                    username: user.username,
                    role: user.user_role,
                    profile_img_url: user.profile_img_url
                }
            }
        })

    } catch (error) {
        if (t) await t.rollback();

        // Validation error
        if (error.name === 'ZodError') {
            const zodIssues = error.issues || error.errors || [];

            logger.warn('Login validation failed', {
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

        logger.error('Unexpected error processing login', {
            requestId,
            error: error.stack
        });

        return res.status(500).json({
            success: false,
            message: "Error processing user login."
        });
    }
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const requestId = req.headers['x-request-id'] || null;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token missing."
        });
    }

    const t = await sequelize.transaction();

    try {
        const [savedToken] = await sequelize.query(
            `SELECT
                t.user_id,
                t.expires_at,
                u.username,
                u.user_role,
                u.user_guid,
                u.force_password_change
            FROM user_refresh_tokens t
            JOIN users u
                ON t.user_id = u.user_id
            WHERE t.token_value=:token`,
            {
                replacements: {
                    token: refreshToken
                },
                type: QueryTypes.SELECT,
                transaction: t
            }
        );

        if (!savedToken || new Date() > savedToken.expires_at) {
            if (savedToken) {
                // Expired
                await sequelize.query(
                    `DELETE FROM user_refresh_tokens WHERE token_value=:token`,
                    {
                        replacements: {
                            token: refreshToken
                        },
                        transaction: t
                    }
                );
            }

            await t.commit();
            res.clearCookie('refreshToken', {
                path: '/api/auth'
            });

            return res.status(403).json({
                success: false,
                message: "Session expired or invalid."
            });
        }

        // Generate new Access Token
        const accessToken = jwt.sign({
            sub: savedToken.user_id,
            guid: savedToken.user_guid,
            role: savedToken.user_role,
            username: savedToken.username,
            fpc: savedToken.force_password_change
        }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

        // Create new token in DB
        const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');

        // Delete old token
        await sequelize.query(
            `DELETE FROM user_refresh_tokens WHERE token_value=:token`,
            {
                replacements: {
                    token: refreshToken
                },
                transaction: t
            }
        );
        // Insert new token
        await sequelize.query(
            `INSERT INTO user_refresh_tokens (user_id, token_value, expires_at, created_at) 
             VALUES (:user_id, :token, :expires, NOW())`,
            {
                replacements: {
                    user_id: savedToken.user_id,
                    token: newRefreshTokenValue,
                    expires: savedToken.expires_at // Maintain original expire time (it hasn't expired)
                },
                transaction: t
            }
        );

        // Update user's last_online
        await sequelize.query(
            `UPDATE users
            SET last_online=NOW()
            WHERE user_id=:user_id`,
            {
                replacements: {
                    user_id: savedToken.user_id
                },
                transaction: t
            }
        );

        await t.commit();

        // Config new cookie
        res.cookie('refreshToken', newRefreshTokenValue, {
            httpOnly: true,
            secure: false, // IMPORTANT: CHANGE THIS WHEN IN PRODUCTION
            sameSite: 'Strict',
            path: '/api/auth',
            maxAge: new Date(savedToken.expires_at).getTime() - new Date().getTime()
        });

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully.",
            data: {
                token: accessToken
            }
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error('Error generating/processing new token.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error generating/processing new token."
        });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const requestId = req.headers['x-request-id'] || null;

    const cookieOptions = {
        path: '/',
        httpOnly: true
    };

    try {
        if (refreshToken) {
            // Clear token
            await sequelize.query(
                `DELETE FROM user_refresh_tokens WHERE token_value=:token`,
                {
                    replacements: {
                        token: refreshToken
                    },
                    type: QueryTypes.DELETE
                }
            );
        }

        // Clear cookie
        res.clearCookie('refreshToken', cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    } catch (error) {
        logger.error('Error during logout process.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error during logout process."
        });
    }
};

const changePassword = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

    try {
        const { currentPassword, newPassword } = req.body;
        const user_id = req.user.sub; // get from jwt

        // Verify if new password is valid
        const validPw = passwordRule.safeParse(newPassword).success;
        if (!validPw) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "New password format is invalid."
            });
        }

        // Get user
        const [user] = await sequelize.query(
            `SELECT password_hash FROM users WHERE user_id=:user_id`,
            {
                replacements: {
                    user_id: user_id
                },
                type: QueryTypes.SELECT,
                transaction: t
            }
        );
        // Compare current pw
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Check if new password is the same as old
        const isSameAsOld = await bcrypt.compare(newPassword, user.password_hash);
        if (isSameAsOld) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "New password cannot be the same as the current one."
            });
        }
        // Update PW and set FPC false
        const newHash = await bcrypt.hash(newPassword, 10);
        await sequelize.query(
            `UPDATE users SET password_hash=:newHash, force_password_change=false
            WHERE user_id=:user_id`,
            {
                replacements: {
                    newHash: newHash,
                    user_id: user_id
                },
                transaction: t
            }
        );

        // Delete refresh tokens
        await sequelize.query(
            `DELETE FROM user_refresh_tokens WHERE user_id=:user_id`,
            {
                replacements: {
                    user_id: user_id
                },
                transaction: t
            }
        );

        await t.commit();

        // Delete cookie
        res.clearCookie('refreshToken', {
            path: '/api/auth'
        });

        return res.status(200).json({
            success: true,
            message: "Password updated. All sessions invalidated. Please login again."
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error('Error changing password.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: `Error changing password.`
        });
    }
};

module.exports = {
    register,
    confirmEmail,
    login,
    logout,
    refresh,
    changePassword
}