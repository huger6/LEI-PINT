// CRUD operations for badge entities (admin-facing).
import api from './api';

// Fetches a filtered list of badges.
export async function getBadges(params = {}) {
	const { data } = await api.get('/badges', { params });
	return data?.data || [];
}

// Fetches a single badge by its slug.
export async function getBadgeBySlug(slug) {
	const { data } = await api.get(`/badges/${slug}`);
	return data?.data;
}

// Creates a new badge.
export async function createBadge(payload) {
	const { data } = await api.post('/badges', payload);
	return data?.data;
}

// Updates an existing badge identified by slug.
export async function updateBadge(slug, payload) {
	const { data } = await api.put(`/badges/${slug}`, payload);
	return data?.data;
}

// Deletes a badge identified by slug.
export async function deleteBadge(slug) {
	await api.delete(`/badges/${slug}`);
}
