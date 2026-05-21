const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const loginRequired = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({
        success: false,
        code: "AUTH_TOKEN_NOT_PROVIDED"
    });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] });

        // If fpc and route isn't change-password we block the request
        // Strip query string before checking to prevent bypass via ?q=change-password
        const pathWithoutQuery = req.originalUrl.split('?')[0];
        const isChangePasswordRoute = pathWithoutQuery.endsWith('/change-password');

        if (decoded.fpc && !isChangePasswordRoute) {
            return res.status(403).json({
                success: false,
                code: "AUTH_FPC_REQUIRED",
                data: {
                    force_password_change: true
                }
            })
        }

        req.user = decoded;
        next();
    } catch (e) {
        logger.error("Invalid Token", e);
        return res.status(401).json({
            success: false,
            code: "AUTH_TOKEN_INVALID"
        });
    }
}

const annonymousUsersOnly = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] });

            return res.status(400).json({
                success: false,
                code: "AUTH_ALREADY_LOGGED_IN"
            });
        } catch (e) {
            // Token is invalid, so the user is not authed
            next();
        }
    } else {
        next();
    }
};

const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({
            success: false,
            code: "AUTH_USER_NOT_AUTHENTICATED"
        });

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                code: "AUTH_ROLE_ACCESS_DENIED"
            });
        }
        next();
    }
}

const optionalAuth = (req, _res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] });
        } catch (_) { /* invalid token — continue as anonymous */ }
    }
    next();
};

const isAdmin = checkRole('Administrator');

const leadership = checkRole('Service Line Leader', 'Talent Manager', 'Administrator');

module.exports = {
    loginRequired,
    optionalAuth,
    annonymousUsersOnly,
    checkRole,
    isAdmin,
    leadership
}