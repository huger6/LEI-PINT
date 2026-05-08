import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../features/auth';
import { getMe } from '../features/auth/api/authApi';
import { connectSocket, disconnectSocket } from '../services/socket';
import * as notificationsApi from '../features/notifications/api/notificationsApi';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
	const { token, isAuthenticated } = useAuth();
	const [user, setUser] = useState(null);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isUserLoading, setIsUserLoading] = useState(true);
	const [notificationsPagination, setNotificationsPagination] = useState(null);
	const socketRef = useRef(null);

	// ── User profile ──────────────────────────────────────────────
	// Fetch once when the user authenticates (login or page-refresh).
	// Depends only on isAuthenticated so a silent token refresh won't re-fetch.
	useEffect(() => {
		if (!isAuthenticated) {
			setUser(null);
			setIsUserLoading(false);
			return;
		}

		setIsUserLoading(true);
		getMe()
			.then(({ data }) => setUser(data.data))
			.catch(() => {})
			.finally(() => setIsUserLoading(false));
	}, [isAuthenticated]);

	// ── Unread count ──────────────────────────────────────────────
	// Seed the badge counter on auth; real-time events keep it in sync afterwards.
	useEffect(() => {
		if (!isAuthenticated) {
			setUnreadCount(0);
			setNotifications([]);
			setNotificationsPagination(null);
			return;
		}

		notificationsApi
			.fetchUnreadCount()
			.then(({ data }) => setUnreadCount(data.data.unread_count))
			.catch(() => {});
	}, [isAuthenticated]);

	// ── WebSocket ─────────────────────────────────────────────────
	// Connect when authenticated, disconnect on logout or token change.
	// The socket authenticates with the JWT; if the token rotates, the
	// effect re-runs so the new socket uses the fresh token.
	useEffect(() => {
		if (!isAuthenticated || !token) {
			disconnectSocket();
			socketRef.current = null;
			return;
		}

		const socket = connectSocket(token);
		socketRef.current = socket;

		// A new notification was created server-side — prepend it and bump the counter.
		socket.on('notification:new', (notification) => {
			setNotifications((prev) => [notification, ...prev]);
			setUnreadCount((prev) => prev + 1);
		});

		// A single notification was marked as read (possibly from another tab).
		socket.on('notification:read', ({ notification_id }) => {
			setNotifications((prev) =>
				prev.map((n) =>
					n.notification_id === notification_id ? { ...n, is_read: true } : n,
				),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		});

		// All notifications marked as read.
		socket.on('notification:all-read', () => {
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
			setUnreadCount(0);
		});

		return () => {
			disconnectSocket();
			socketRef.current = null;
		};
	}, [isAuthenticated, token]);

	// ── Actions ───────────────────────────────────────────────────

	const markAsRead = useCallback(async (notificationId) => {
		await notificationsApi.markNotificationRead(notificationId);
		// The WebSocket event from the server will update local state,
		// keeping every connected tab in sync automatically.
	}, []);

	const markAllAsRead = useCallback(async () => {
		await notificationsApi.markAllNotificationsRead();
	}, []);

	/**
	 * Load a page of notifications from the API.
	 * Pass `append: true` when loading the next page so previous items are kept.
	 */
	const fetchNotifications = useCallback(async (params = {}) => {
		const { append = false, ...query } = params;
		const { data } = await notificationsApi.fetchNotifications(query);
		setNotifications((prev) => (append ? [...prev, ...data.data] : data.data));
		setNotificationsPagination(data.pagination);
		return data;
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				isUserLoading,
				notifications,
				notificationsPagination,
				unreadCount,
				markAsRead,
				markAllAsRead,
				fetchNotifications,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
