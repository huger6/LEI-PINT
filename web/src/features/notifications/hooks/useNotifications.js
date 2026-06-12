import { useContext } from 'react';
import { UserContext } from '../../../context/UserContext';

export function useNotifications() {
	const ctx = useContext(UserContext);

	if (!ctx) throw new Error('useNotifications must be used inside UserProvider');

	return {
		notifications: ctx.notifications.list,
		pagination: ctx.notifications.pagination,
		unreadCount: ctx.notifications.unreadCount,
		unreadByType: ctx.notifications.unreadByType,
		markAsRead: ctx.notifications.markAsRead,
		markAllAsRead: ctx.notifications.markAllAsRead,
		fetchNotifications: ctx.notifications.fetch,
	};
}
