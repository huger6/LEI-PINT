// API for managing badge requirements (CRUD operations).
import api from '../../../services/api';

// Badge requirements are nested under a badge: /badges/:badgeSlug/requirements
// Fetches all requirements for a given badge slug.
export async function getRequirements(badgeSlug, params = {}) {
	const { data } = await api.get(`/badges/${badgeSlug}/requirements`, { params });
	return data?.data || [];
}

// Creates a new requirement under the specified badge.
export async function createRequirement(badgeSlug, payload) {
	const { data } = await api.post(`/badges/${badgeSlug}/requirements`, payload);
	return data?.data;
}

// Updates an existing requirement for the specified badge.
export async function updateRequirement(badgeSlug, requirementId, payload) {
	const { data } = await api.put(`/badges/${badgeSlug}/requirements/${requirementId}`, payload);
	return data?.data;
}

// Deletes a requirement from the specified badge.
export async function deleteRequirement(badgeSlug, requirementId) {
	await api.delete(`/badges/${badgeSlug}/requirements/${requirementId}`);
}
