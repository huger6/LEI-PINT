import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../features/auth';
import { getMe } from '../features/auth/api/authApi';
import { connectSocket, disconnectSocket } from '../services/socket';
import * as notificationsApi from '../features/notifications/api/notificationsApi';
import { firstAndLastName } from '../utils/utils';

export const UserContext = createContext(null);
const NOTIFICATION_TYPES = ['HOME', 'BADGES', 'APPLICATIONS', 'ACHIEVEMENTS', 'POINTS', 'OBJECTIVES', 'EVOLUTION', 'ANNOUNCEMENTS', 'SYSTEM'];

const createEmptyUnreadByType = () =>
	NOTIFICATION_TYPES.reduce((acc, type) => {
		acc[type] = 0;
		return acc;
	}, {});

const normalizeNotificationType = (type) => {
	if (!type) return null;
	const normalizedType = String(type).toUpperCase();
	return NOTIFICATION_TYPES.includes(normalizedType) ? normalizedType : null;
};

const getNotificationType = (notification) =>
	normalizeNotificationType(notification?.notification_type || notification?.type);

const getUnreadByTypeFromNotifications = (notificationsList = []) => {
	const unreadByType = createEmptyUnreadByType();

	for (const notification of notificationsList) {
		if (notification?.is_read) continue;
		const type = getNotificationType(notification);
		if (!type) continue;
		unreadByType[type] += 1;
	}

	return unreadByType;
};

export function UserProvider({ children }) {
	const { token, isAuthenticated } = useAuth();
	const [user, setUser] = useState(null);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [unreadByType, setUnreadByType] = useState(() => createEmptyUnreadByType());
	const [isUserLoading, setIsUserLoading] = useState(true);
	const [notificationsPagination, setNotificationsPagination] = useState(null);
	const socketRef = useRef(null);
	const displayName = user?.fullName
		? firstAndLastName(user.fullName)
		: user?.username || 'User';

	const fetchUnreadByTypeSummary = useCallback(async () => {
		const unreadByType = createEmptyUnreadByType();
		let page = 1;
		let totalPages = 1;

		do {
			const { data: response } = await notificationsApi.fetchNotifications({
				page,
				limit: 100,
				is_read: false,
			});

			const rows = Array.isArray(response?.data) ? response.data : [];
			const pageUnreadByType = getUnreadByTypeFromNotifications(rows);
			for (const type of NOTIFICATION_TYPES) {
				unreadByType[type] += pageUnreadByType[type];
			}

			const pagination = response?.pagination || {};
			const currentPage = Number(pagination.currentPage ?? page);
			const parsedTotalPages = Number(pagination.totalPages ?? totalPages);
			totalPages = Number.isFinite(parsedTotalPages) && parsedTotalPages > 0 ? parsedTotalPages : 1;
			page = Number.isFinite(currentPage) ? currentPage + 1 : totalPages + 1;
		} while (page <= totalPages);

		return unreadByType;
	}, []);

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
			setUnreadByType(createEmptyUnreadByType());
			return;
		}

		let ignore = false;

		Promise.all([
			notificationsApi.fetchUnreadCount(),
			fetchUnreadByTypeSummary(),
		])
			.then(([{ data }, unreadByTypeSummary]) => {
				if (ignore) return;
				setUnreadCount(data?.data?.unread_count || 0);
				setUnreadByType(unreadByTypeSummary);
			})
			.catch(() => {
				if (ignore) return;
				setUnreadByType(createEmptyUnreadByType());
			});

		return () => {
			ignore = true;
		};
	}, [isAuthenticated, fetchUnreadByTypeSummary]);

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
			const notificationType = getNotificationType(notification);
			if (notificationType) {
				setUnreadByType((prev) => ({
					...prev,
					[notificationType]: (prev[notificationType] || 0) + 1,
				}));
			}
		});

		// A single notification was marked as read (possibly from another tab).
		socket.on('notification:read', ({ notification_id }) => {
			setNotifications((prev) =>
				prev.map((n) =>
					n.notification_id === notification_id ? { ...n, is_read: true } : n,
				),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
			fetchUnreadByTypeSummary()
				.then(setUnreadByType)
				.catch(() => {});
		});

		// All notifications marked as read.
		socket.on('notification:all-read', () => {
			setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
			setUnreadCount(0);
			setUnreadByType(createEmptyUnreadByType());
		});

		return () => {
			disconnectSocket();
			socketRef.current = null;
		};
	}, [isAuthenticated, token, fetchUnreadByTypeSummary]);

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
		const rows = Array.isArray(data?.data) ? data.data : [];
		setNotifications((prev) => (append ? [...prev, ...rows] : rows));
		setNotificationsPagination(data?.pagination || null);
		return data;
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				displayName,
				isUserLoading,
				notifications,
				notificationsPagination,
				unreadCount,
				unreadByType,
				markAsRead,
				markAllAsRead,
				fetchNotifications,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
