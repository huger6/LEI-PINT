const { logger, isLoggingEnabled, redactSensitiveData } = require('../utils/logger');

const requestLogger = (req, res, next) => {
    if (!isLoggingEnabled) {
        next();
        return;
    }

    const startedAt = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    res.setHeader('x-request-id', requestId);

    logger.debug('Incoming request', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('user-agent'),
        headers: redactSensitiveData(req.headers),
        query: redactSensitiveData(req.query),
        params: redactSensitiveData(req.params),
        body: redactSensitiveData(req.body)
    });

    res.on('finish', () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

        logger.debug('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTimeMs: Number(elapsedMs.toFixed(2)),
            responseSize: res.getHeader('content-length') || null
        });
    });

    res.on('close', () => {
        if (res.writableEnded) {
            return;
        }

        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

        logger.warn('Request aborted by client', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            responseTimeMs: Number(elapsedMs.toFixed(2))
        });
    });

    next();
};

module.exports = requestLogger;