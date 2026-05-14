const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const loadEnvironment = require('../config/loadEnv');
const { emailRule, passwordRule, registerSchema, loginSchema } = require('../validations/auth.validation');
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../services/email.service');
const { moveImageToPermanent } = require('../services/storage.service');
const { logger } = require('../utils/logger');
const { sendTopicUpdate } = require('../services/firebase.service');

loadEnvironment();

function getUpdatedStreak(lastOnline, currentStreak) {
    if (!lastOnline) return 1;
    const msPerDay = 86400000;
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const lastUTC = Date.UTC(lastOnline.getUTCFullYear(), lastOnline.getUTCMonth(), lastOnline.getUTCDate());
    const diffDays = (todayUTC - lastUTC) / msPerDay;
    if (diffDays === 0) return currentStreak;
    if (diffDays === 1) return currentStreak + 1;
    return 1;
}

const register = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

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
                code: "AUTH_ROLE_NOT_REGISTERABLE"
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
                code: 'AUTH_CREDENTIALS_CONFLICT'
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
            language_id: userData.language_id,
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

        // Generate email confirmation token (store hash, send raw value)
        const tokenValue = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
        await models.user_account_tokens.create({
            user_id: newUser.user_id,
            token_value: tokenHash,
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
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 7);
        if (userData.user_role === 'Consultant') {
            await sendTopicUpdate("new_data", 2);
            await sendTopicUpdate("new_data", 3);
        } else if (userData.user_role === 'Talent Manager') {
            await sendTopicUpdate("new_data", 4);
        } else if (userData.user_role === 'Service Line Leader') {
            await sendTopicUpdate("new_data", 5);
        }

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
            userData.language_id
        );

        if (!emailResult?.success) {
            logger.error('Registration completed but confirmation email failed to send', {
                requestId,
                user_id: newUser.user_id,
                email_address: userData.email_address,
                language_id: userData.language_id,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                code: "AUTH_REGISTER_EMAIL_FAILED"
            });
        }

        logger.info('Confirmation email sent after registration', {
            requestId,
            user_id: newUser.user_id,
            email_address: userData.email_address,
            language_id: userData.language_id
        });

        return res.status(201).json({
            success: true,
            code: "AUTH_REGISTER_SUCCESS"
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
                code: 'VALIDATION_INVALID_DATA',
                errors: zodIssues.map((err) => ({
                    field: Array.isArray(err.path) ? err.path[0] : undefined,
                    code: err.code || 'VALIDATION_INVALID_DATA'
                }))
            });
        }

        // Dups error (more of a failsafe as it is checked above as well)
        if (error.name === 'SequelizeUniqueConstraintError') {
            logger.warn('Registration failed due to unique constraint', {
                requestId,
                error
            });

            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA'
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
                code: 'AUTH_PROFILE_IMAGE_STORAGE_FAILED'
            });
        }

        logger.error('Unexpected error processing registration', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: 'AUTH_REGISTER_FAILED'
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

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const tokenRecord = await models.user_account_tokens.findOne({
            where: {
                token_value: hashedToken,
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
                code: 'AUTH_TOKEN_INVALID_OR_USED'
            });
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
                code: 'AUTH_TOKEN_EXPIRED'
            });
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

        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 7);

        logger.info('Email confirmation completed successfully', {
            requestId,
            user_id: tokenRecord.user_id,
            token_id: tokenRecord.token_id
        });

        return res.status(200).json({
            success: true,
            code: 'AUTH_EMAIL_CONFIRMED'
        });
    } catch (error) {
        logger.error('Unexpected error confirming email', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: 'AUTH_EMAIL_CONFIRM_FAILED',
            requestId
        });
    }
};

const login = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

    try {
        const { identifier, password, remember } = loginSchema.parse(req.body);

        // Identift it is email or username
        const isEmail = emailRule.safeParse(identifier).success;

        const searchCriteria = isEmail ? { email_address: identifier } : { username: identifier };

        logger.info(`Login attempt identified as ${isEmail ? 'email' : 'username'}`, {
            requestId,
            identifier
        });

        // Check account lockout before hitting the DB for password comparison
        const lockKey = `login:lock:${identifier}`;
        const isLocked = await redis.get(lockKey);
        if (isLocked) {
            await t.rollback();
            const ttl = await redis.ttl(lockKey);
            return res.status(429).json({
                success: false,
                code: "AUTH_ACCOUNT_LOCKED",
                data: { retryAfter: ttl }
            });
        }

        const user = await models.users.findOne({ where: searchCriteria });

        if (!user) {
            await t.rollback();

            return res.status(400).json({
                success: false,
                code: "AUTH_INVALID_CREDENTIALS"
            });
        }

        if (!user.is_active) {
            await t.rollback();

            return res.status(403).json({
                success: false,
                code: "AUTH_ACCOUNT_DEACTIVATED"
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            await t.rollback();

            const failKey = `login:fail:${identifier}`;
            const failCount = await redis.incr(failKey);
            if (failCount === 1) await redis.expire(failKey, 15 * 60);
            if (failCount >= 5) {
                await redis.set(lockKey, '1', 'EX', 15 * 60);
                await redis.del(failKey);
            }

            logger.warn('Failed login attempt: wrong password.', {
                requestId,
                identifier,
                failCount
            });
            return res.status(401).json({
                success: false,
                code: "AUTH_INVALID_CREDENTIALS"
            });
        }

        // Clear failed attempt counter on successful password match
        await redis.del(`login:fail:${identifier}`);

        // Check if user has confirmed it's email
        if (!user.email_confirmed) {
            await t.rollback();

            logger.warn('Failed login attempt: e-mail address is not confirmed.', {
                requestId,
                identifier
            });
            return res.status(403).json({
                success: false,
                code: "AUTH_EMAIL_NOT_CONFIRMED"
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
            algorithm: 'HS256',
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

        // Save data first to handle fist login specific logic
        const last_login_at = user.last_login_at;
        const last_online = user.last_online;
        const current_streak_days = getUpdatedStreak(last_online, user.current_streak_days);
        // Update last login date and streak
        await user.update({
            last_login_at: new Date(),
            last_online: new Date(),
            current_streak_days: current_streak_days
        }, { transaction: t });

        await t.commit();
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 8);

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
            code: user.force_password_change ? "AUTH_LOGIN_FPC_REQUIRED" : "AUTH_LOGIN_SUCCESS",
            data: {
                token: accessToken,
                fpc: user.force_password_change,
                user: {
                    full_name: user.full_name,
                    username: user.username,
                    role: user.user_role,
                    profile_img_url: user.profile_img_url,
                    first_login: last_login_at === null ? true : false,
                    last_login_at: last_login_at,
                    last_online: last_online,
                    current_streak_days: current_streak_days
                }
            }
        });

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
                code: "VALIDATION_INVALID_DATA",
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
            code: "AUTH_REQUEST_FAILED",
            requestId
        });
    }
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const requestId = req.headers['x-request-id'] || null;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            code: "AUTH_REFRESH_TOKEN_MISSING"
        });
    }

    try {
        const storedToken = await models.user_refresh_tokens.findOne({
            where: { token_value: refreshToken }
        });

        if (!storedToken) {
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(403).json({
                success: false,
                code: "AUTH_SESSION_EXPIRED_OR_INVALID"
            });
        }

        // Check if token has expired
        if (new Date(storedToken.expires_at) < new Date()) {
            await storedToken.destroy(); // clear from db
            res.clearCookie('refreshToken', { path: '/api/auth' });
            return res.status(403).json({
                success: false,
                code: "AUTH_SESSION_EXPIRED"
            });
        }

        // Get user data
        const user = await models.users.findByPk(storedToken.user_id);

        if (!user || !user.is_active) {
            return res.status(403).json({
                success: false,
                code: "AUTH_USER_INACTIVE_OR_NOT_FOUND"
            });
        }

        // Get new access token
        const accessToken = jwt.sign({
            sub: user.user_id,
            guid: user.user_guid,
            role: user.user_role,
            username: user.username,
            fpc: user.force_password_change
        }, process.env.JWT_SECRET_KEY, {
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

        const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');

        await storedToken.update({
            token_value: newRefreshTokenValue
        });

        await user.update({
            last_online: new Date(),
            current_streak_days: getUpdatedStreak(user.last_online, user.current_streak_days)
        });
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 8);

        const remainingTimeMs = new Date(storedToken.expires_at).getTime() - new Date().getTime();

        // Set new cookie
        res.cookie('refreshToken', newRefreshTokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/auth',
            maxAge: remainingTimeMs
        });

        return res.status(200).json({
            success: true,
            code: "AUTH_TOKEN_REFRESHED",
            data: {
                token: accessToken,
                fpc: user.force_password_change
            }
        });
    } catch (error) {
        logger.error('Error generating/processing new token.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: "AUTH_TOKEN_REFRESH_FAILED",
            requestId
        });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const requestId = req.headers['x-request-id'] || null;

    const cookieOptions = {
        path: '/api/auth',
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
            await sendTopicUpdate("new_data", 8);
        }

        // Clear cookie
        res.clearCookie('refreshToken', cookieOptions);

        return res.status(200).json({
            success: true,
            code: "AUTH_LOGOUT_SUCCESS"
        });
    } catch (error) {
        logger.error('Error during logout process.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: "AUTH_LOGOUT_FAILED",
            requestId
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
                code: "AUTH_PASSWORD_FORMAT_INVALID"
            });
        }

        // Get user
        const user = await models.users.findByPk(user_id, {
            attributes: ['user_id', 'user_guid', 'user_role', 'username', 'password_hash'],
            transaction: t
        });
        // Compare current pw
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: "AUTH_CURRENT_PASSWORD_WRONG"
            });
        }

        // Check if new password is the same as old
        const isSameAsOld = await bcrypt.compare(newPassword, user.password_hash);
        if (isSameAsOld) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                code: "AUTH_PASSWORD_SAME_AS_CURRENT"
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

        // Revoke all existing refresh tokens
        await models.user_refresh_tokens.destroy({
            where: {
                user_id: user_id
            },
            transaction: t
        });

        // Issue new access token (fpc is now false)
        const accessToken = jwt.sign(
            {
                sub: user.user_id,
                guid: user.user_guid,
                role: user.user_role,
                username: user.username,
                fpc: false
            },
            process.env.JWT_SECRET_KEY,
            { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        // Issue new refresh token to re-establish the session
        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const refreshTokenDurationDays = 1;
        const expiresAt = new Date(Date.now() + refreshTokenDurationDays * 24 * 60 * 60 * 1000);

        await models.user_refresh_tokens.create({
            user_id: user.user_id,
            token_value: refreshTokenValue,
            expires_at: expiresAt
        }, { transaction: t });

        await t.commit();
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 8);

        res.cookie('refreshToken', refreshTokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/auth',
            maxAge: refreshTokenDurationDays * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            code: "AUTH_PASSWORD_CHANGED",
            data: { token: accessToken }
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error('Error changing password.', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: "AUTH_PASSWORD_CHANGE_FAILED",
            requestId
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
            code: "AUTH_EMAIL_INVALID"
        });
    }

    const t = await sequelize.transaction();

    try {
        // Get user
        const user = await models.users.findOne({
            attributes: ['user_id', 'full_name', 'language_id', 'email_address'],
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
            await sendTopicUpdate("new_data", 7);

            // Send email
            const emailResult = await sendResetPasswordEmail(
                user.email_address,
                user.full_name,
                resetToken,
                user.language_id
            );

            if (!emailResult?.success) {
                logger.error('Password reset process completed, but failed to send e-mail.', {
                    requestId,
                    user_id: user.user_id,
                    email_address: user.email_address,
                    language_id: user.language_id,
                    emailError: emailResult?.error
                });
            }
        } else {
            await t.commit(); // Empty
        }

        // Always the same for improved security
        return res.status(200).json({
            success: true,
            code: "AUTH_RESET_LINK_SENT"
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error("Forgot password error.",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            code: "AUTH_REQUEST_FAILED",
            requestId
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
                code: "AUTH_TOKEN_REQUIRED"
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
                code: "AUTH_TOKEN_INVALID_OR_EXPIRED"
            });
        }

        return res.status(200).json({
            success: true,
            code: "AUTH_TOKEN_VALID"
        });
    } catch (error) {
        logger.error("Error validating reset token.",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            code: "AUTH_REQUEST_FAILED",
            requestId
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
                code: "AUTH_PASSWORD_WEAK",
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
                code: "AUTH_TOKEN_INVALID_OR_USED"
            });
        }

        if (new Date() > tokenRecord.expires_at) {
            await t.rollback();
            return res.status(410).json({
                success: false,
                code: "AUTH_TOKEN_EXPIRED"
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
        await sendTopicUpdate("new_data", 1);
        await sendTopicUpdate("new_data", 7);
        await sendTopicUpdate("new_data", 8);

        // Delete cookie
        res.clearCookie('refreshToken', {
            path: '/api/auth'
        });

        return res.status(200).json({
            success: true,
            code: "AUTH_PASSWORD_RESET_SUCCESS"
        });
    } catch (error) {
        if (t) await t.rollback();

        logger.error("Error reseting password",
            requestId,
            error
        );
        return res.status(500).json({
            success: false,
            code: "AUTH_REQUEST_FAILED",
            requestId
        });
    }
};

const verifySession = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    // loginRequired should be called, so if we are here session is good
    return res.status(200).json({
        success: true,
        code: "AUTH_SESSION_VALID",
        requestId
    });
};

const resendConfirmation = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const { email } = req.body;

    try {
        const user = await models.users.findOne({
            attributes: ['user_id', 'full_name', 'email_address', 'email_confirmed', 'language_id'],
            where: {
                email_address: email
            }
        });

        if (!user) {
            // True for security reasons
            return res.status(200).json({
                success: true,
                code: "AUTH_RESEND_CONFIRMATION_SENT"
            });
        }

        if (user.email_confirmed) {
            // Return identical response to prevent enumeration of confirmed accounts
            return res.status(200).json({
                success: true,
                code: "AUTH_RESEND_CONFIRMATION_SENT"
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
                code: "AUTH_RESEND_RATE_LIMITED",
                data: { retryAfter: remainingTime }
            });
        }

        const tokenValue = crypto.randomBytes(32).toString('hex');
        const resendTokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');

        const confirmationExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const existingConfirmationToken = await models.user_account_tokens.findOne({
            where: {
                user_id: user.user_id,
                token_type: 'CONFIRMATION'
            }
        });

        if (existingConfirmationToken) {
            await existingConfirmationToken.update({
                token_value: resendTokenHash,
                expires_at: confirmationExpiry,
                created_at: new Date(),
                is_used: false
            });
        } else {
            await models.user_account_tokens.create({
                user_id: user.user_id,
                token_value: resendTokenHash,
                token_type: 'CONFIRMATION',
                expires_at: confirmationExpiry,
                is_used: false
            });
        }
        await sendTopicUpdate("new_data", 7);

        // Send confirmation email and validate service outcome
        const emailResult = await sendConfirmationEmail(
            user.email_address,
            user.full_name,
            tokenValue,
            user.language_id
        );

        // Set cache
        await redis.set(rateLimitKey, '1', 'EX', 120);

        if (!emailResult?.success) {
            logger.error('Failed to send confirmation email.', {
                requestId,
                user_id: user.user_id,
                email_address: user.email_address,
                language_id: user.language_id,
                emailError: emailResult?.error
            });

            return res.status(502).json({
                success: false,
                code: "AUTH_CONFIRMATION_EMAIL_FAILED"
            });
        }

        return res.status(200).json({
            success: true,
            code: "AUTH_CONFIRMATION_RESENT"
        });
    } catch (error) {
        logger.error('Error resending confirmation email', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: "AUTH_RESEND_CONFIRMATION_FAILED",
            requestId
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
    resendConfirmation,
};
