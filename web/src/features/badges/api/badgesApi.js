import api from '../../../services/api';

export async function getBadges(params = {}) {
	const { data } = await api.get('/badges', { params });
	return data?.data || [];
}

export async function getBadgeBySlug(slug) {
	const { data } = await api.get(`/badges/${slug}`);
	return data?.data;
}

export async function createBadge(payload) {
	const { data } = await api.post('/badges', payload);
	return data?.data;
}

export async function updateBadge(slug, payload) {
	const { data } = await api.put(`/badges/${slug}`, payload);
	return data?.data;
}

export async function deleteBadge(slug) {
	await api.delete(`/badges/${slug}`);
}
