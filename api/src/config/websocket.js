let Server;
try {
    Server = require('socket.io').Server;
} catch (err) {
    Server = null;
}
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

let io = null;

function initWebSocket(httpServer) {
    if (!Server) {
        logger && logger.info && logger.info('socket.io not available; websocket functionality disabled');
        return null;
    }

    const allowedOrigins = [process.env.APP_URL, process.env.WEB_APP_URL].filter(Boolean);
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
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
