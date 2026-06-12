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
	const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

	// ── User & language state ─────────────────────────────────────
	const [user, setUser] = useState(null);
	const [lang, setLang] = useState(null);
	const [isUserLoading, setIsUserLoading] = useState(true);
	const [points, setPoints] = useState(0);

	// ── Notification state ────────────────────────────────────────
	const [notificationsList, setNotificationsList] = useState([]);
	const [notificationsPagination, setNotificationsPagination] = useState(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const [unreadByType, setUnreadByType] = useState(() => createEmptyUnreadByType());

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
	const refreshPoints = useCallback(async () => {
		try {
			const data = await getPointsSummary();
			setPoints(data?.totalPoints ?? 0);
		} catch { /* non-blocking */ }
	}, []);

	const refreshUser = useCallback(async () => {
		const { data } = await getMe();
		const { lang: langData, ...userProfile } = data.data;
		setUser(userProfile);
		setLang(langData ?? null);
		if (userProfile.role === 'Consultant') refreshPoints();
	}, [refreshPoints]);

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

	// ── WebSocket ─────────────────────────────────────────────────
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

	const markAsRead = useCallback(async (notificationId) => {
		await notificationsApi.markNotificationRead(notificationId);
	}, []);

	const markAllAsRead = useCallback(async () => {
		await notificationsApi.markAllNotificationsRead();
	}, []);

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
