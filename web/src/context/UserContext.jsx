// Provides the authenticated user's profile, language, points, and notification state.
import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../features/auth';
import { getMe, updateUserLanguage } from '../features/auth/api/authApi';
import { connectSocket, disconnectSocket } from '../services/socket';
import * as notificationsApi from '../features/notifications/api/notificationsApi';
import { getPointsSummary } from '../services/pointsService';
import { firstAndLastName } from '../utils/utils';
import i18next from 'i18next';

export const UserContext = createContext(null);
const NOTIFICATION_TYPES = ['HOME', 'BADGES', 'APPLICATIONS', 'ACHIEVEMENTS', 'POINTS', 'OBJECTIVES', 'EVOLUTION', 'ANNOUNCEMENTS', 'SYSTEM'];

// Creates a zeroed unread-count map keyed by each notification type.
const createEmptyUnreadByType = () =>
	NOTIFICATION_TYPES.reduce((acc, type) => {
		acc[type] = 0;
		return acc;
	}, {});

// Normalizes a raw notification type string to an uppercase known type, or null if unrecognized.
const normalizeNotificationType = (type) => {
	if (!type) return null;
	const normalizedType = String(type).toUpperCase();
	return NOTIFICATION_TYPES.includes(normalizedType) ? normalizedType : null;
};

// Extracts and normalizes the type field from a notification object.
const getNotificationType = (notification) =>
	normalizeNotificationType(notification?.notification_type || notification?.type);

// Counts unread notifications per type from a list and returns the totals map.
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

/**
 * Loads the user profile after authentication, manages notification state via WebSocket,
 * and exposes actions for marking notifications as read and changing language.
 */
// Provides user profile, points, language, and notification state to the component tree.
export function UserProvider({ children }) {
	// Reads auth state (token, authentication flag, loading flag) from AuthContext.
	const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

	// ── User & language state ─────────────────────────────────────
	// Stores the authenticated user's profile object.
	const [user, setUser] = useState(null);
	// Stores the user's currently selected language object.
	const [lang, setLang] = useState(null);
	// Indicates the user profile fetch is still in progress.
	const [isUserLoading, setIsUserLoading] = useState(true);
	// Stores the user's total accumulated points.
	const [points, setPoints] = useState(0);

	// ── Notification state ────────────────────────────────────────
	// Holds the current page of fetched notifications.
	const [notificationsList, setNotificationsList] = useState([]);
	// Stores pagination metadata for the notifications list.
	const [notificationsPagination, setNotificationsPagination] = useState(null);
	// Tracks the total number of unread notifications across all types.
	const [unreadCount, setUnreadCount] = useState(0);
	// Tracks unread notification counts broken down by notification type.
	const [unreadByType, setUnreadByType] = useState(() => createEmptyUnreadByType());
	// Last notification received over the socket. Pages subscribe to this (via the
	// useNotificationEvent hook) to refresh their own data in real time — e.g. the
	// applications list updating its status the moment a validation step happens.
	const [lastNotification, setLastNotification] = useState(null);

	// Holds a ref to the active WebSocket instance for cleanup.
	const socketRef = useRef(null);
	const displayName = user?.fullName
		? firstAndLastName(user.fullName)
		: user?.username || 'User';

	// Fetches all unread notifications page-by-page to build the per-type unread count map.
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
	// Refreshes the user's total points from the points summary endpoint.
	const refreshPoints = useCallback(async () => {
		try {
			const data = await getPointsSummary();
			setPoints(data?.totalPoints ?? 0);
		} catch { /* non-blocking */ }
	}, []);

	// Fetches the current user's full profile and updates user and language state.
	const refreshUser = useCallback(async () => {
		const { data } = await getMe();
		const { lang: langData, ...userProfile } = data.data;
		setUser(userProfile);
		setLang(langData ?? null);
		if (userProfile.role === 'Consultant') refreshPoints();
	}, [refreshPoints]);

	// Loads the user profile whenever auth state changes, resetting it on logout.
	useEffect(() => {
		if (isAuthLoading) {
			setIsUserLoading(true);
			return;
		}

		if (!isAuthenticated) {
			setUser(null);
			setLang(null);
			setIsUserLoading(false);
			return;
		}

		setIsUserLoading(true);
		refreshUser()
			.catch(() => { })
			.finally(() => setIsUserLoading(false));
	}, [isAuthLoading, isAuthenticated, token, refreshUser]);

	// Switches the UI language and persists the preference to the API.
	const handleLanguageChange = useCallback(async (languageId, languageIso) => {
		i18next.changeLanguage(languageIso);
		try {
			await updateUserLanguage(languageId);
			setLang((prev) => ({ ...prev, id: languageId, iso: languageIso }));
		} catch {
			// language UI already updated; API failure is non-blocking
		}
	}, []);

	// ── Unread count ──────────────────────────────────────────────
	// Fetches unread notification counts when auth state changes, resetting them on logout.
	useEffect(() => {
		if (!isAuthenticated) {
			setUnreadCount(0);
			setNotificationsList([]);
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

	// Connects to the WebSocket for real-time notification updates.
	useEffect(() => {
		if (!isAuthenticated || !token) {
			disconnectSocket();
			socketRef.current = null;
			return;
		}

		const socket = connectSocket(token);
		socketRef.current = socket;

		socket.on('notification:new', (notification) => {
			setNotificationsList((prev) => [notification, ...prev]);
			setUnreadCount((prev) => prev + 1);
			// Expose the raw event so subscribed pages can react (re-fetch) in real time.
			setLastNotification(notification);
			const notificationType = getNotificationType(notification);
			if (notificationType) {
				setUnreadByType((prev) => ({
					...prev,
					[notificationType]: (prev[notificationType] || 0) + 1,
				}));
			}
			if (notificationType === 'POINTS' || notificationType === 'ACHIEVEMENTS') {
				refreshPoints();
			}
		});

		socket.on('notification:read', ({ notification_id }) => {
			setNotificationsList((prev) =>
				prev.map((n) =>
					n.notification_id === notification_id ? { ...n, is_read: true } : n,
				),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
			fetchUnreadByTypeSummary()
				.then(setUnreadByType)
				.catch(() => { });
		});

		socket.on('notification:all-read', () => {
			setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
			setUnreadCount(0);
			setUnreadByType(createEmptyUnreadByType());
		});

		return () => {
			disconnectSocket();
			socketRef.current = null;
		};
	}, [isAuthenticated, token, fetchUnreadByTypeSummary, refreshPoints]);

	// ── Actions ───────────────────────────────────────────────────

	// Marks a single notification as read via the API.
	const markAsRead = useCallback(async (notificationId) => {
		await notificationsApi.markNotificationRead(notificationId);
	}, []);

	// Marks all notifications as read via the API.
	const markAllAsRead = useCallback(async () => {
		await notificationsApi.markAllNotificationsRead();
	}, []);

	// Fetches a page of notifications and updates the list, optionally appending to existing results.
	const fetchNotifications = useCallback(async (params = {}) => {
		const { append = false, ...query } = params;
		const { data } = await notificationsApi.fetchNotifications(query);
		const rows = Array.isArray(data?.data) ? data.data : [];
		setNotificationsList((prev) => (append ? [...prev, ...rows] : rows));
		setNotificationsPagination(data?.pagination || null);
		return data;
	}, []);

	return (
		<UserContext.Provider
			value={{
				user,
				refreshUser,
				lang,
				displayName,
				isUserLoading,
				points,
				refreshPoints,
				handleLanguageChange,
				notifications: {
					list: notificationsList,
					pagination: notificationsPagination,
					unreadCount,
					unreadByType,
					last: lastNotification,
					markAsRead,
					markAllAsRead,
					fetch: fetchNotifications,
				},
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
