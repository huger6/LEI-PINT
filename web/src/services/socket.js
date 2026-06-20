import { io } from 'socket.io-client';
import { getApiToken } from './api';

let socket = null;

/**
 * Creates a socket.io connection authenticated with the given JWT.
 * Only one connection is kept alive — calling this again replaces the previous one.
 */
export function connectSocket(token) {
	if (socket) socket.disconnect();

	socket = io(import.meta.env.API_URL, {
		auth: { token },
		reconnection: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 30000,
	});

	// On each reconnection attempt, pick up any token the API interceptor
	// may have refreshed since the original connection was established.
	socket.io.on('reconnect_attempt', () => {
		const freshToken = getApiToken();
		if (freshToken) socket.auth.token = freshToken;
	});

	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}

export function getSocket() {
	return socket;
}
