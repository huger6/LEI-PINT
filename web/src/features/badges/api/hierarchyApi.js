// API for browsing the organizational hierarchy (learning paths, service lines, areas, levels).
import api from '../../../services/api';

// ─── Learning Paths ───

// Fetches a flat list of learning paths matching the given query params.
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

// Fetches a single learning path's details by its slug.
export async function getLearningPathBySlug(slug) {
	const { data } = await api.get(`/learning-paths/${slug}`);
	return data?.data;
}

// Creates a new learning path with the supplied payload.
export async function createLearningPath(payload) {
	const { data } = await api.post('/learning-paths', payload);
	return data?.data;
}

// Updates an existing learning path identified by its slug.
export async function updateLearningPath(slug, payload) {
	const { data } = await api.put(`/learning-paths/${slug}`, payload);
	return data?.data;
}

// Deletes a learning path by its slug.
export async function deleteLearningPath(slug) {
	await api.delete(`/learning-paths/${slug}`);
}

// ─── Service Lines ───

// Fetches a flat list of service lines matching the given query params.
export async function getServiceLines(params = {}) {
	const { data } = await api.get('/service-lines', { params });
	return data?.data || [];
}

// Fetches a single service line's details by its slug.
export async function getServiceLineBySlug(slug) {
	const { data } = await api.get(`/service-lines/${slug}`);
	return data?.data;
}

// Creates a new service line with the supplied payload.
export async function createServiceLine(payload) {
	const { data } = await api.post('/service-lines', payload);
	return data?.data;
}

// Updates an existing service line identified by its slug.
export async function updateServiceLine(slug, payload) {
	const { data } = await api.put(`/service-lines/${slug}`, payload);
	return data?.data;
}

// Deletes a service line by its slug.
export async function deleteServiceLine(slug) {
	await api.delete(`/service-lines/${slug}`);
}

// ─── Areas ───

// Fetches a flat list of areas matching the given query params.
export async function getAreas(params = {}) {
	const { data } = await api.get('/areas', { params });
	return data?.data || [];
}

// Fetches a single area's details by its slug.
export async function getAreaBySlug(slug) {
	const { data } = await api.get(`/areas/${slug}`);
	return data?.data;
}

// Creates a new area with the supplied payload.
export async function createArea(payload) {
	const { data } = await api.post('/areas', payload);
	return data?.data;
}

// Updates an existing area identified by its slug.
export async function updateArea(slug, payload) {
	const { data } = await api.put(`/areas/${slug}`, payload);
	return data?.data;
}

// Deletes an area by its slug.
export async function deleteArea(slug) {
	await api.delete(`/areas/${slug}`);
}

// ─── Levels (Progression Stages) ───

// Fetches a flat list of progression stage levels matching the given query params.
export async function getLevels(params = {}) {
	const { data } = await api.get('/levels', { params });
	return data?.data || [];
}

// Fetches a single progression level by its stage code.
export async function getLevelByCode(stageCode) {
	const { data } = await api.get(`/levels/${stageCode}`);
	return data?.data;
}

// Creates a new progression level with the supplied payload.
export async function createLevel(payload) {
	const { data } = await api.post('/levels', payload);
	return data?.data;
}

// Updates an existing progression level identified by its stage code.
export async function updateLevel(stageCode, payload) {
	const { data } = await api.put(`/levels/${stageCode}`, payload);
	return data?.data;
}

// Deletes a progression level by its stage code.
export async function deleteLevel(stageCode) {
	await api.delete(`/levels/${stageCode}`);
}
