import { useContext } from 'react';
import { UserContext } from '../../../context/UserContext';

export function useNotifications() {
	const ctx = useContext(UserContext);

	if (!ctx) throw new Error('useNotifications must be used inside UserProvider');

	return {
		notifications: ctx.notifications,
		pagination: ctx.notificationsPagination,
		unreadCount: ctx.unreadCount,
		markAsRead: ctx.markAsRead,
		markAllAsRead: ctx.markAllAsRead,
		fetchNotifications: ctx.fetchNotifications,
	};
}
