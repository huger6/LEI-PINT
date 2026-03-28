const loadEnvironment = require('./src/config/loadEnv');
const { logger } = require('./src/utils/logger');

loadEnvironment();

const { sequelize } = require('./src/config/db');
const { app, PORT } = require('./src/app');

async function verifyDatabaseConnection() {
    await sequelize.authenticate();
    logger.info('Database connection OK');
}

function startHttpServer() {
    app.listen(PORT, () => {
        logger.info('Server started', {
            port: PORT,
            url: `http://localhost:${PORT}`
        });
    });
}

function handleFatalError(label, error) {
    if (error instanceof Error) {
        logger.error(label, {
            message: error.message,
            stack: error.stack
        });
    } else {
        logger.error(label, {
            reason: String(error)
        });
    }

    process.exit(1);
}

async function bootstrap() {
    try {
        await verifyDatabaseConnection();
        startHttpServer();
    } catch (error) {
        handleFatalError('Startup failed', error);
    }
}

process.on('unhandledRejection', (reason) => {
    handleFatalError('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (error) => {
    handleFatalError('Uncaught exception', error);
});

bootstrap();