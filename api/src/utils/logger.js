const fs = require('fs');
const path = require('path');
const winston = require('winston');
const loadEnvironment = require('../config/loadEnv');

loadEnvironment();

const SENSITIVE_KEYS = [
    'password',
    'pass',
    'pwd',
    'token',
    'authorization',
    'secret',
    'apikey',
    'api_key',
    'access_token',
    'refresh_token',
    'cookie',
    'set-cookie'
];

const LOG_FILE_NAME = 'api-debug.log';
const LOG_DIRECTORY = path.resolve(__dirname, '../../logs');

function parseBoolean(value, fallbackValue) {
    if (typeof value !== 'string') {
        return fallbackValue;
    }

    const normalizedValue = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalizedValue);
}

function redactSensitiveData(value, seen = new WeakSet()) {
    if (value === null || value === undefined) {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof Error) {
        return {
            message: value.message,
            stack: value.stack
        };
    }

    if (Buffer.isBuffer(value)) {
        return `[Buffer ${value.length} bytes]`;
    }

    if (typeof value === 'string') {
        if (value.length > 2000) {
            return `${value.slice(0, 2000)}...[truncated]`;
        }

        return value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (seen.has(value)) {
        return '[Circular]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => redactSensitiveData(item, seen));
    }

    const redactedObject = {};

    Object.entries(value).forEach(([key, nestedValue]) => {
        const normalizedKey = key.toLowerCase();
        const isSensitiveField = SENSITIVE_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey));

        if (isSensitiveField) {
            redactedObject[key] = '[REDACTED]';
            return;
        }

        redactedObject[key] = redactSensitiveData(nestedValue, seen);
    });

    return redactedObject;
}

function ensureLogDirectoryExists() {
    if (!fs.existsSync(LOG_DIRECTORY)) {
        fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
    }
}

const isLoggingEnabled = parseBoolean(process.env.LOGGING_ENABLED, true);
const isProduction = process.env.NODE_ENV === 'production';

if (isLoggingEnabled && !isProduction) {
    ensureLogDirectoryExists();
}

function buildTransports() {
    if (!isLoggingEnabled) {
        return [];
    }

    if (isProduction) {
        return [
            new winston.transports.Console({
                level: process.env.LOG_LEVEL || 'info'
            })
        ];
    }

    return [
        new winston.transports.File({
            filename: path.join(LOG_DIRECTORY, LOG_FILE_NAME),
            level: 'debug'
        })
    ];
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: buildTransports()
});

if (!isLoggingEnabled) {
    logger.silent = true;
}

module.exports = {
    logger,
    isLoggingEnabled,
    redactSensitiveData
};