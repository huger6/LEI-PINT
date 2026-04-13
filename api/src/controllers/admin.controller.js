const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { emailRule, loginSchema } = require('../validations/auth.validation');
const { logger } = require('../utils/logger');

const login = async (req, res) => {
    const t = await sequelize.transaction();
    const requestId = req.headers['x-request-id'] || null;

    try {
        const { identifier, password, remember } = loginSchema.parse(req.body);

        // Email or username?
        const isEmail = emailRule.safeParse(identifier).success;
        const searchCriteria = isEmail ? { email_address: identifier } : { username: identifier };

        logger.info(`Admin login attempt identified as ${isEmail ? 'email' : 'username'}`, {
            requestId,
            identifier
        });

        // Get user
        const user = await models.users.findOne({ where: searchCriteria, transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

        // Check if user is indeed an admin
        if (user.user_role !== 'Administrator') {
            await t.rollback();
            logger.warn('Failed admin login attempt: user is not an administrator.', {
                requestId,
                identifier,
                role: user.user_role
            });
            return res.status(403).json({
                success: false,
                message: "Access denied. Administrator privileges required."
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            await t.rollback();
            logger.warn('Failed admin login attempt: wrong password.', {
                requestId,
                identifier
            });
            return res.status(401).json({
                success: false,
                message: "Invalid credentials."
            });
        }

        // Check if email is confirmed
        if (!user.email_confirmed) {
            await t.rollback();
            logger.warn('Failed admin login attempt: e-mail address is not confirmed.', {
                requestId,
                identifier
            });
            return res.status(403).json({
                success: false,
                message: "Please validate your e-mail address first."
            });
        }

        // Generate JWT 
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

        // Generate refresh token
        const refreshTokenDurationDays = remember ? 30 : 0.35; // 8h
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (refreshTokenDurationDays * 24));

        const refreshTokenValue = crypto.randomBytes(40).toString('hex');

        await models.user_refresh_tokens.create({
            user_id: user.user_id,
            token_value: refreshTokenValue,
            expires_at: expiresAt
        }, { transaction: t });

        // Store in redis
        const cacheData = {
            user_id: user.user_id,
            user_guid: user.user_guid,
            user_role: user.user_role,
            username: user.username,
            force_password_change: user.force_password_change
        };
        const tokenTTL = refreshTokenDurationDays * 24 * 60 * 60;
        await redis.set(`auth:refresh:${refreshTokenValue}`, JSON.stringify(cacheData), 'EX', tokenTTL);

        await user.update({
            last_login_at: new Date(),
            last_online: new Date()
        }, { transaction: t });

        await t.commit();

        res.cookie('adminRefreshToken', refreshTokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/admin/auth',
            maxAge: refreshTokenDurationDays * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: user.force_password_change ? "Password change required" : "Admin login successful.",
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
        });

    } catch (error) {
        if (t) await t.rollback();

        if (error.name === 'ZodError') {
            const zodIssues = error.issues || error.errors || [];
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: zodIssues.map((err) => ({
                    field: Array.isArray(err.path) ? err.path[0] : undefined,
                    message: err.message
                }))
            });
        }

        logger.error('Unexpected error processing admin login', { requestId, error: error.stack });
        return res.status(500).json({
            success: false,
            message: "Error processing admin login."
        });
    }
}

const refresh = async (req, res) => {
    // Get cookie
    const refreshToken = req.cookies.adminRefreshToken;
    const requestId = req.headers['x-request-id'] || null;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Admin refresh token missing."
        });
    }

    const oldTokenKey = `auth:refresh:${refreshToken}`;

    try {
        const cachedData = await redis.get(oldTokenKey);

        if (!cachedData) {
            res.clearCookie('adminRefreshToken', { path: '/api/admin/auth' });
            return res.status(403).json({
                success: false,
                message: "Session expired or invalid."
            });
        }

        const userData = JSON.parse(cachedData);

        // Check if role stored in cache is still an admin
        if (userData.user_role !== 'Administrator') {
            res.clearCookie('adminRefreshToken', { path: '/api/admin/auth' });
            return res.status(403).json({
                success: false,
                message: "Access denied. Role mismatch in session."
            });
        }

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
        const remainingTTL = await redis.ttl(oldTokenKey);

        if (remainingTTL <= 0) throw new Error("Token TTL invalid");

        await redis.del(oldTokenKey);
        await redis.set(newTokenKey, JSON.stringify(userData), 'EX', remainingTTL);

        await sequelize.transaction(async (t) => {
            // Delete old token
            await models.user_refresh_tokens.destroy({
                where: { token_value: refreshToken },
                transaction: t
            });

            // Create new token
            await models.user_refresh_tokens.create({
                user_id: userData.user_id,
                token_value: newRefreshTokenValue,
                expires_at: new Date(Date.now() + remainingTTL * 1000)
            }, { transaction: t });

            // Update last_online
            await models.users.update(
                { last_online: new Date() },
                { where: { user_id: userData.user_id }, transaction: t }
            );
        });

        res.cookie('adminRefreshToken', newRefreshTokenValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/api/admin/auth',
            maxAge: remainingTTL * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Admin token refreshed successfully.",
            data: { token: accessToken }
        });
    } catch (error) {
        logger.error('Error generating new admin token.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: "Error generating new admin token."
        });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies.adminRefreshToken;
    const requestId = req.headers['x-request-id'] || null;

    const cookieOptions = {
        path: '/api/admin/auth',
        httpOnly: true
    };

    try {
        if (refreshToken) {
            await models.user_refresh_tokens.destroy({
                where: { token_value: refreshToken }
            });
            await redis.del(`auth:refresh:${refreshToken}`);
        }

        res.clearCookie('adminRefreshToken', cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Admin logged out successfully."
        });
    } catch (error) {
        logger.error('Error during admin logout process.', { requestId, error });
        return res.status(500).json({
            success: false,
            message: "Error during admin logout process."
        });
    }
};

module.exports = {
    login,
    refresh,
    logout
};