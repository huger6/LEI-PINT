import api from '../../../services/api';

// Badge requirements are nested under a badge: /badges/:badgeSlug/requirements
export async function getRequirements(badgeSlug, params = {}) {
	const { data } = await api.get(`/badges/${badgeSlug}/requirements`, { params });
	return data?.data || [];
}

export async function createRequirement(badgeSlug, payload) {
	const { data } = await api.post(`/badges/${badgeSlug}/requirements`, payload);
	return data?.data;
}

export async function updateRequirement(badgeSlug, requirementId, payload) {
	const { data } = await api.put(`/badges/${badgeSlug}/requirements/${requirementId}`, payload);
	return data?.data;
}

export async function deleteRequirement(badgeSlug, requirementId) {
	await api.delete(`/badges/${badgeSlug}/requirements/${requirementId}`);
}
