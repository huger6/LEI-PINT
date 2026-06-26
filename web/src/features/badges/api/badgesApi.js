// Badge CRUD API with support for favorites, image uploads, and admin operations.
import api from '../../../services/api';

// Fetches a flat list of badges matching the given query params.
export async function getBadges(params = {}) {
	const { data } = await api.get('/badges', { params });
	return data?.data || [];
}

// Fetches a paginated badge catalog suitable for browsing screens.
export async function getBadgesCatalog(params = {}) {
	const { data } = await api.get('/badges', { params });

	return {
		data: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 }
	};
}

// Fetches a single badge's full details by its URL slug.
export async function getBadgeBySlug(slug) {
	const { data } = await api.get(`/badges/${slug}`);
	return data?.data;
}

// Creates a new badge with the supplied payload.
export async function createBadge(payload) {
	const { data } = await api.post('/badges', payload);
	return data?.data;
}

// Updates an existing badge identified by its slug.
export async function updateBadge(slug, payload) {
	const { data } = await api.put(`/badges/${slug}`, payload);
	return data?.data;
}

// Permanently deletes a badge by its slug.
export async function deleteBadge(slug) {
	await api.delete(`/badges/${slug}`);
}
