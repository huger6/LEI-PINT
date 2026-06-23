// Badge CRUD API with support for favorites, image uploads, and admin operations.
import api from '../../../services/api';

export async function getBadges(params = {}) {
	const { data } = await api.get('/badges', { params });
	return data?.data || [];
}

export async function getBadgesCatalog(params = {}) {
	const { data } = await api.get('/badges', { params });

	return {
		data: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 }
	};
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
