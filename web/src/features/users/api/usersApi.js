import api from '../../../services/api';

// ─── Users ───

export async function getUsers(params = {}) {
	const { data } = await api.get('/admin/users', { params });
	return data?.data || [];
}

export async function createUser(payload) {
	const { data } = await api.post('/admin/users', payload);
	return data?.data;
}

export async function updateUser(userGuid, payload) {
	const { data } = await api.put(`/admin/users/${userGuid}`, payload);
	return data?.data;
}

export async function deactivateUser(userGuid) {
	await api.delete(`/admin/users/${userGuid}`);
}

export async function resetUserPassword(userGuid) {
	const { data } = await api.post(`/admin/users/${userGuid}/reset-password`);
	return data?.data;
}
