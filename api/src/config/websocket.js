const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

let io = null;

function initWebSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.APP_URL,
            credentials: true
        }
    });

    // Authenticate every connection by verifying the JWT from the handshake.
    // Reject the socket before it joins any room if the token is missing or invalid.
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('AUTH_TOKEN_NOT_PROVIDED'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, { algorithms: ['HS256'] });
            socket.userId = decoded.sub;
            next();
        } catch {
            return next(new Error('AUTH_TOKEN_INVALID'));
        }
    });

    io.on('connection', (socket) => {
        // Place each authenticated user in a private room keyed by their user ID.
        // This lets us push notifications to a specific user even across multiple tabs/devices.
        const userRoom = `user:${socket.userId}`;
        socket.join(userRoom);

        logger.info('WebSocket client connected', { userId: socket.userId, socketId: socket.id });

        socket.on('disconnect', () => {
            logger.info('WebSocket client disconnected', { userId: socket.userId, socketId: socket.id });
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('WebSocket server not initialised — call initWebSocket(httpServer) first');
    }
    return io;
}

// Emit a notification event to a single user's private room.
// Every connected tab/device for that user receives it in real time.
function emitToUser(userId, event, data) {
    if (!io) return;

    io.to(`user:${userId}`).emit(event, data);
}

module.exports = {
    initWebSocket,
    getIO,
    emitToUser
};
