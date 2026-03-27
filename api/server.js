const loadEnvironment = require('./src/config/loadEnv');
const { logger } = require('./src/utils/logger');

loadEnvironment();

const db = require('./src/config/db');
const { app, PORT } = require('./src/app');

async function startServer() {
    try {
        await db.testConnection();
        logger.info('Database connection OK');

        app.listen(PORT, () => {
            logger.info('Server started', {
                port: PORT,
                url: `http://localhost:${PORT}`
            });
        });
    } catch (error) {
        logger.error('Database connection FAILED', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        logger.error('Unhandled promise rejection', {
            message: reason.message,
            stack: reason.stack
        });
        return;
    }

    logger.error('Unhandled promise rejection', {
        reason: String(reason)
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
        message: error.message,
        stack: error.stack
    });
    process.exit(1);
});

startServer();