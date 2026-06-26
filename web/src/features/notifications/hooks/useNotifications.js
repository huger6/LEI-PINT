// Hook for accessing notification state and actions from the UserContext.
import { useContext } from 'react';
import { UserContext } from '../../../context/UserContext';

// Returns notification state and action helpers from UserContext.
export function useNotifications() {
	// Reads the UserContext value to access the notifications sub-object.
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
