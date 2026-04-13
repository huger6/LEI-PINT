const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const loginRequired = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({
        success: false,
        message: "Token wasn't provided."
    });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // If fpc and route isn't change-password we block the request
        const isChangePasswordRoute = req.originalUrl.includes('change-password');

        if (decoded.fpc && !isChangePasswordRoute) {
            return res.status(403).json({
                success: false,
                message: "Password change required before accessing this resource.",
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
            message: "Session expired or token is invalid."
        });
    }
}

const annonymousUsersOnly = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET_KEY);

            return res.status(400).json({
                success: false,
                message: "You are already logged in. Logout to access this route."
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
            message: "User not authenticated."
        });

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Authorized roles: ${allowedRoles.join(', ')}.`
            });
        }
        next();
    }
}

module.exports = {
    loginRequired,
    annonymousUsersOnly,
    checkRole
}