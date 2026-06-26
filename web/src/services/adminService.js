// Admin-only user management: list, create, update, deactivate, and password reset.
import api from './api';

// ─── Users ───

// Fetches a filtered list of users for admin management.
export async function getUsers(params = {}) {
	const { data } = await api.get('/admin/users', { params });
	return data?.data || [];
}

// Creates a new user account via the admin endpoint.
export async function createUser(payload) {
	const { data } = await api.post('/admin/users', payload);
	return data?.data;
}

// Updates a user's profile fields via the admin endpoint.
export async function updateUser(userGuid, payload) {
	const { data } = await api.put(`/admin/users/${userGuid}`, payload);
	return data?.data;
}

// Deactivates (soft-deletes) a user account via the admin endpoint.
export async function deactivateUser(userGuid) {
	await api.delete(`/admin/users/${userGuid}`);
}

// Triggers a password reset for the given user via the admin endpoint.
export async function resetUserPassword(userGuid) {
	const { data } = await api.post(`/admin/users/${userGuid}/reset-password`);
	return data?.data;
}
