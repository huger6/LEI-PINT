import api from '../../../services/api';

// ─── Learning Paths ───

export async function getLearningPaths(params = {}) {
	const { data } = await api.get('/learning-paths', { params });
	return data?.data || [];
}

// Same endpoint as getLearningPaths but preserves the pagination metadata
// (e.g. for dashboard totals that need pagination.totalItems).
export async function getLearningPathsPaged(params = {}) {
	const { data } = await api.get('/learning-paths', { params });
	return {
		data: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 },
	};
}

export async function getLearningPathBySlug(slug) {
	const { data } = await api.get(`/learning-paths/${slug}`);
	return data?.data;
}

export async function createLearningPath(payload) {
	const { data } = await api.post('/learning-paths', payload);
	return data?.data;
}

export async function updateLearningPath(slug, payload) {
	const { data } = await api.put(`/learning-paths/${slug}`, payload);
	return data?.data;
}

export async function deleteLearningPath(slug) {
	await api.delete(`/learning-paths/${slug}`);
}

// ─── Service Lines ───

export async function getServiceLines(params = {}) {
	const { data } = await api.get('/service-lines', { params });
	return data?.data || [];
}

export async function getServiceLineBySlug(slug) {
	const { data } = await api.get(`/service-lines/${slug}`);
	return data?.data;
}

export async function createServiceLine(payload) {
	const { data } = await api.post('/service-lines', payload);
	return data?.data;
}

export async function updateServiceLine(slug, payload) {
	const { data } = await api.put(`/service-lines/${slug}`, payload);
	return data?.data;
}

export async function deleteServiceLine(slug) {
	await api.delete(`/service-lines/${slug}`);
}

// ─── Areas ───

export async function getAreas(params = {}) {
	const { data } = await api.get('/areas', { params });
	return data?.data || [];
}

export async function getAreaBySlug(slug) {
	const { data } = await api.get(`/areas/${slug}`);
	return data?.data;
}

export async function createArea(payload) {
	const { data } = await api.post('/areas', payload);
	return data?.data;
}

export async function updateArea(slug, payload) {
	const { data } = await api.put(`/areas/${slug}`, payload);
	return data?.data;
}

export async function deleteArea(slug) {
	await api.delete(`/areas/${slug}`);
}

// ─── Levels (Progression Stages) ───

export async function getLevels(params = {}) {
	const { data } = await api.get('/levels', { params });
	return data?.data || [];
}

export async function getLevelByCode(stageCode) {
	const { data } = await api.get(`/levels/${stageCode}`);
	return data?.data;
}

export async function createLevel(payload) {
	const { data } = await api.post('/levels', payload);
	return data?.data;
}

export async function updateLevel(stageCode, payload) {
	const { data } = await api.put(`/levels/${stageCode}`, payload);
	return data?.data;
}

export async function deleteLevel(stageCode) {
	await api.delete(`/levels/${stageCode}`);
}
