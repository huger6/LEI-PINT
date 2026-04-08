const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const loadEnvironment = require('../config/loadEnv');
const { emailRule, passwordRule, registerSchema, loginSchema } = require('../validations/auth.validation');
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');
const stripNullishFields = require('../utils/stripNullishFields');
const { moveImageToPermanent } = require('../services/storageService');

loadEnvironment();

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
        const existingUser = await models.users.findOne({
            attributes: ['user_id', 'email_address', 'username'],
            where: {
                [Op.or]: [
                    { email_address: userData.email_address },
                    { username: userData.username }
                ]
            },
            transaction: t
        });

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

        // Send confirmation email and validate service outcome
        const emailResult = await sendConfirmationEmail(
            userData.email_address,
            userData.full_name,
            tokenValue,
            userData.preferred_lang_id
        );

        if (!emailResult?.success) {
            logger.error('Registration completed but confirmation email failed to send', {
                requestId,
                user_id: newUser.user_id,
                email_address: userData.email_address,
                preferred_lang_id: userData.preferred_lang_id,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                message: "Account created, but confirmation e-mail could not be sent. Please request a new confirmation e-mail or use the link below.",
                data: {
                    verification_link: `${process.env.APP_URL}/api/auth/confirm-email?token=${tokenValue}` // CHANGE TO FRONTEND LINK
                }
            });
        }

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

        const tokenRecord = await models.user_account_tokens.findOne({
            where: {
                token_value: token,
                token_type: 'CONFIRMATION',
                is_used: false
            }
        });

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
        const refreshTokenDurationDays = remember ? 30 : 0.35; // 8h
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
            secure: process.env.NODE_ENV === 'production',
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

    const oldTokenKey = `auth:refresh:${refreshToken}`;

    try {
        // Search token in redis
        const cachedData = await redis.get(oldTokenKey);

        if (!cachedData) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            // If token isn't in cache it is invalid or expired
            return res.status(403).json({
                success: false,
                message: "Session expired or invalid."
            });
        }

        // Get user data
        const userData = JSON.parse(cachedData);

        // Get new access token
        const accessToken = jwt.sign({
            sub: userData.user_id,
            guid: userData.user_guid,
            role: userData.user_role,
            username: userData.username,
            fpc: userData.force_password_change
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

        const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');
        const newTokenKey = `auth:refresh:${newRefreshTokenValue}`;

        //  Get original TTL
        const remainingTTL = await redis.ttl(oldTokenKey);

        if (remainingTTL <= 0) {
            throw new Error("Token TTL invalid");
        }
        // Delete old, set new 
        await redis.del(oldTokenKey);
        await redis.set(newTokenKey, JSON.stringify(userData), 'EX', remainingTTL);

        await models.users.update(
            { last_online: new Date() },
            {
                where: {
                    user_id: userData.user_id
                }
            }
        );

        // Set new cookie
        res.cookie('refreshToken', newRefreshTokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/auth',
            maxAge: remainingTTL * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully.",
            data: {
                token: accessToken
            }
        });
    } catch (error) {
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
            await models.user_refresh_tokens.destroy({
                where: {
                    token_value: refreshToken
                }
            });
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
        const user = await models.users.findByPk(user_id, {
            attributes: ['password_hash'],
            transaction: t
        });
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
        await models.users.update(
            {
                password_hash: newHash,
                force_password_change: false
            },
            {
                where: {
                    user_id: user_id
                },
                transaction: t
            }
        );

        // Delete refresh tokens
        await models.user_refresh_tokens.destroy({
            where: {
                user_id: user_id
            },
            transaction: t
        });

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

const forgotPassword = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const { email } = req.body;

    if (!emailRule.safeParse(email).success) {
        // Email is invalid
        return res.status(400).json({
            success: false,
            message: "E-mail is invalid."
        });
    }

    const t = await sequelize.transaction();

    try {
        // Get user
        const user = await models.users.findOne({
            attributes: ['user_id', 'full_name', 'preferred_lang_id', 'email_address'],
            where: {
                email_address: email
            },
            transaction: t
        });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const expires = new Date(Date.now() + 3600000); //1h

            // Store token
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
                    expires_at: expires,
                    is_used: false
                }, { transaction: t });
            } else {
                await models.user_account_tokens.create({
                    user_id: user.user_id,
                    token_value: tokenHash,
                    token_type: 'PASSWORD_RESET',
                    expires_at: expires,
                    is_used: false
                }, { transaction: t });
            }

            await t.commit();

            // Send email
            const emailResult = await sendResetPasswordEmail(
                user.email_address,
                user.full_name,
                resetToken,
                user.preferred_lang_id
            );

            if (!emailResult?.success) {
                logger.error('Password reset process completed, but failed to send e-mail.', {
                    requestId,
                    user_id: user.user_id,
                    email_address: user.email_address,
                    preferred_lang_id: user.preferred_lang_id,
                    emailError: emailResult?.error
                });

                return res.status(502).json({
                    success: false,
                    message: "Failed to send e-mail with password update follow-up. Please use the link below.",
                    data: {
                        reset_password_link: `${process.env.APP_URL}/api/auth/reset-password?token=${resetToken}` // CHANGE TO FRONTEND LINK
                    }
                });
            }
        } else {
            await t.commit(); // Empty 
        }

        // Always the same for improved security
        return res.status(200).json({
            success: true,
            message: "A reset link has been sent to your e-mail address."
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error("Forgot password error.",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            message: "Error processing request."
        });
    }
};

const validateResetToken = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const { token } = req.params;

    try {
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required."
            });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const record = await models.user_account_tokens.findOne({
            attributes: ['expires_at'],
            where: {
                token_value: tokenHash,
                token_type: 'PASSWORD_RESET'
            }
        });

        if (!record || new Date() > record.expires_at) {
            return res.status(400).json({
                success: false,
                message: "Token invalid or expired."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid."
        });
    } catch (error) {
        logger.error("Error validating reset token.",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            message: "Error processing request."
        });
    }

};

const resetPassword = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const { token, newPassword } = req.body;

    const t = await sequelize.transaction();

    try {
        // Validate new pw
        const validation = passwordRule.safeParse(newPassword);
        if (!validation.success) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "New password does not meat security requirements (format).",
                data: {
                    errors: validation.error.issues
                }
            });
        }

        // Generate token hash
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Get token and user id
        const tokenRecord = await models.user_account_tokens.findOne({
            attributes: ['user_id', 'expires_at'],
            where: {
                token_value: tokenHash,
                token_type: 'PASSWORD_RESET'
            },
            transaction: t
        });

        if (!tokenRecord) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid or already used token"
            });
        }

        if (new Date() > tokenRecord.expires_at) {
            await t.rollback();
            return res.status(410).json({
                success: false,
                message: "Token has expired."
            });
        }

        // Hash new pw
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user
        await models.users.update(
            {
                password_hash: passwordHash,
                force_password_change: false
            },
            {
                where: {
                    user_id: tokenRecord.user_id
                },
                transaction: t
            }
        );

        // Delete used token
        await models.user_account_tokens.destroy({
            where: {
                user_id: tokenRecord.user_id,
                token_type: 'PASSWORD_RESET'
            },
            transaction: t
        });

        // Logout all sessions
        await models.user_refresh_tokens.destroy({
            where: {
                user_id: tokenRecord.user_id
            },
            transaction: t
        });

        await t.commit();

        // Delete cookie
        res.clearCookie('refreshToken', {
            path: '/api/auth'
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. You can now log in with your new credentials."
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error("Error reseting password",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            message: "Error processing request."
        });
    }
};

const verifySession = async (req, res) => {
    // loginRequired should be called, so if we are here session is good
    return res.status(200).json({
        success: true,
        message: "Session is okay."
    });
};

const me = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const user_id = req.user.sub; // from jwt

    const cacheKey = `user:profile:${user_id}`;

    try {
        // Check if data is on cache
        const cachedProfile = await redis.get(cacheKey);

        if (cachedProfile) {
            return res.status(200).json({
                success: true,
                message: "User data retrieved successfully.",
                data: JSON.parse(cachedProfile)
            });
        }

        const user = await models.users.findByPk(user_id, {
            attributes: [
                'user_id',
                'user_guid',
                'full_name',
                'username',
                'email_address',
                'user_role',
                'profile_img_url',
                'preferred_lang_id',
                'location_id'
            ],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const [location, preferredLang, consultant, talentManager, serviceLineLeader, consultantAreas] = await Promise.all([
            user.location_id
                ? models.locations.findByPk(user.location_id, {
                    attributes: ['location_name'],
                    raw: true
                })
                : null,
            user.preferred_lang_id
                ? models.preferred_lang.findByPk(user.preferred_lang_id, {
                    attributes: ['preferred_lang'],
                    raw: true
                })
                : null,
            models.consultants.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography'],
                raw: true
            }),
            models.talent_managers.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography'],
                raw: true
            }),
            models.service_line_leaders.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography', 'service_line_id'],
                raw: true
            }),
            models.consultant_areas.findAll({
                where: { user_id: user.user_id },
                attributes: ['area_id', 'is_primary'],
                raw: true
            })
        ]);

        let areasPayload = null;

        if (consultantAreas.length > 0) {
            const areaIds = consultantAreas.map((area) => area.area_id);
            const areaRecords = await models.areas.findAll({
                where: {
                    area_id: {
                        [Op.in]: areaIds
                    }
                },
                attributes: ['area_id', 'area_name', 'service_line_id'],
                raw: true
            });

            const areaById = new Map(areaRecords.map((area) => [area.area_id, area]));

            areasPayload = consultantAreas
                .map((consultantArea) => {
                    const currentArea = areaById.get(consultantArea.area_id);

                    if (!currentArea) {
                        return null;
                    }

                    return {
                        id: currentArea.area_id,
                        name: currentArea.area_name,
                        isPrimary: consultantArea.is_primary
                    };
                })
                .filter(Boolean);

            if (areasPayload.length === 0) {
                areasPayload = null;
            }
        }

        let serviceLineName = null;
        let learningPathTitle = null;

        const resolveServiceLineData = async (serviceLineId) => {
            if (!serviceLineId) {
                return;
            }

            const serviceLine = await models.services_lines.findByPk(serviceLineId, {
                attributes: ['service_line_name', 'learning_path_id'],
                raw: true
            });

            if (!serviceLine) {
                return;
            }

            serviceLineName = serviceLine.service_line_name;

            if (serviceLine.learning_path_id) {
                const learningPath = await models.learning_paths.findByPk(serviceLine.learning_path_id, {
                    attributes: ['path_title'],
                    raw: true
                });

                learningPathTitle = learningPath?.path_title || null;
            }
        };

        if (serviceLineLeader?.service_line_id) {
            await resolveServiceLineData(serviceLineLeader.service_line_id);
        } else if (consultantAreas.length > 0) {
            const primaryArea = consultantAreas.find((area) => area.is_primary);

            if (primaryArea) {
                const areaWithServiceLine = await models.areas.findByPk(primaryArea.area_id, {
                    attributes: ['service_line_id'],
                    raw: true
                });

                await resolveServiceLineData(areaWithServiceLine?.service_line_id);
            }
        }

        const profile = stripNullishFields({
            id: user.user_id,
            guid: user.user_guid,
            fullName: user.full_name,
            username: user.username,
            email: user.email_address,
            role: user.user_role,
            profileImg: user.profile_img_url,
            lang: preferredLang?.preferred_lang || null,
            location: location?.location_name || null,
            biography: consultant?.biography || talentManager?.biography || serviceLineLeader?.biography || null,
            serviceLine: serviceLineName,
            learningPath: learningPathTitle,
            areas: areasPayload
        });

        // Store in cache
        await redis.set(cacheKey, JSON.stringify(profile), 'EX', 3600);

        return res.status(200).json({
            success: true,
            message: "User data retreived successfully.",
            data: profile
        });
    } catch (error) {
        logger.error('Error fetching current user', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error fetching profile information."
        });
    }
};

const resendConfirmation = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const { email } = req.body;

    try {
        const user = await models.users.findOne({
            attributes: ['user_id', 'full_name', 'email_address', 'email_confirmed', 'preferred_lang_id'],
            where: {
                email_address: email
            }
        });

        if (!user) {
            // True for security reasons
            return res.status(200).json({
                success: true,
                message: "If the account is not confirmed, a new e-mail will be sent."
            });
        }

        if (user.email_confirmed) {
            return res.status(400).json({
                success: false,
                message: "This account is already confirmed."
            });
        }

        // Rate limit: 2 minutes
        const rateLimitKey = `auth:resend_limit:${user.user_id}`;

        const isBlocked = await redis.get(rateLimitKey);

        if (isBlocked) {
            // Get time until it's unlocked
            const remainingTime = await redis.ttl(rateLimitKey);

            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingTime} seconds before requesting a new e-mail.`
            });
        }

        const tokenValue = crypto.randomBytes(32).toString('hex');

        const confirmationExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const existingConfirmationToken = await models.user_account_tokens.findOne({
            where: {
                user_id: user.user_id,
                token_type: 'CONFIRMATION'
            }
        });

        if (existingConfirmationToken) {
            await existingConfirmationToken.update({
                token_value: tokenValue,
                expires_at: confirmationExpiry,
                created_at: new Date(),
                is_used: false
            });
        } else {
            await models.user_account_tokens.create({
                user_id: user.user_id,
                token_value: tokenValue,
                token_type: 'CONFIRMATION',
                expires_at: confirmationExpiry,
                is_used: false
            });
        }

        // Send confirmation email and validate service outcome
        const emailResult = await sendConfirmationEmail(
            user.email_address,
            user.full_name,
            tokenValue,
            user.preferred_lang_id
        );

        // Set cache
        await redis.set(rateLimitKey, '1', 'EX', 120);

        if (!emailResult?.success) {
            logger.error('Failed to send confirmation email.', {
                requestId,
                user_id: user.user_id,
                email_address: user.email_address,
                preferred_lang_id: user.preferred_lang_id,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                message: "Failed to send confirmation email. Please use the link below.",
                data: {
                    verification_link: `${process.env.APP_URL}/api/auth/confirm-email?token=${tokenValue}` // CHANGE TO FRONTEND LINK
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "New confirmation e-mail sent."
        });
    } catch (error) {
        logger.error('Error resending confirmation email', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            message: "Error resending confirmation email."
        });
    }
}

module.exports = {
    register,
    confirmEmail,
    login,
    logout,
    refresh,
    changePassword,
    forgotPassword,
    validateResetToken,
    resetPassword,
    verifySession,
    me,
    resendConfirmation
}