import api from './api';

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
