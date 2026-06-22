const http = require('http');
const loadEnvironment = require('./src/config/loadEnv');
const { logger } = require('./src/utils/logger');

loadEnvironment();

const { sequelize } = require('./src/config/db');
const { app, PORT } = require('./src/app');
const { initWebSocket } = require('./src/config/websocket');

async function verifyDatabaseConnection() {
    await sequelize.authenticate();
    logger.info('Database connection OK');
}

function startHttpServer() {
    // Wrap Express in a raw HTTP server so socket.io can share the same port.
    const server = http.createServer(app);
    initWebSocket(server);

    server.on('error', (error) => {
        handleFatalError('HTTP server error', error);
    });

    server.listen(PORT, () => {
        logger.info('Server started', {
            port: PORT,
            url: `http://localhost:${PORT}`
        });
    });
}

function handleFatalError(label, error) {
    const logArgs = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { reason: String(error) };

    // Wait for the logger to flush before exiting so the error is written to disk.
    logger.error(label, logArgs, () => process.exit(1));
}

async function bootstrap() {
    try {
        await verifyDatabaseConnection();
        startHttpServer();
    } catch (error) {
        handleFatalError('Startup failed', error);
    }
}

// A single stray promise rejection (a background worker, a Redis/email hiccup,
// a request handler) must NOT take the whole API down — log it and keep serving.
// Otherwise the process exits and any in-flight request (e.g. a CSV export) gets
// a connection reset that surfaces as a generic "server error" in the UI.
process.on('unhandledRejection', (reason) => {
    const logArgs = reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : { reason: String(reason) };
    logger.error('Unhandled promise rejection (kept alive)', logArgs);
});

// An uncaught synchronous exception can leave state corrupted, so this one still
// exits (a process manager / nodemon restarts it).
process.on('uncaughtException', (error) => {
    handleFatalError('Uncaught exception', error);
});

bootstrap();