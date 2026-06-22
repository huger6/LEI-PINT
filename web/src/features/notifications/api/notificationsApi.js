import api from '../../../services/api';

export const fetchNotifications = ({ page = 1, limit = 20, type, is_read } = {}) => {
	const params = { page, limit };

	if (type) params.type = type;
	if (is_read !== undefined) params.is_read = is_read;

	return api.get('/notifications', { params });
};

export const fetchUnreadCount = () =>
	api.get('/notifications/unread-count');

export const markNotificationRead = (notificationId) =>
	api.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
	api.put('/notifications/read-all');

// Per-user notification preferences. Each row carries the global default,
// the user override (or null = inherit) and the effective resolved value.
export async function getUserPreferences() {
	const { data } = await api.get('/notifications/preferences');
	return data?.data || [];
}

// payload: { is_enabled?, send_email?, send_push? } — each true/false to override,
// or send all-null to reset back to the global default.
export async function updateUserPreference(definitionId, payload) {
	const { data } = await api.put(`/notifications/preferences/${definitionId}`, payload);
	return data?.data;
}
