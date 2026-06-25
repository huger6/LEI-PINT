// CRUD operations for the organizational hierarchy: Learning Paths, Service Lines, Areas, and Levels.
import api from './api';

// ─── Learning Paths ───

// Fetches a filtered list of learning paths.
export async function getLearningPaths(params = {}) {
	const { data } = await api.get('/learning-paths', { params });
	return data?.data || [];
}

// Fetches a single learning path by its slug.
export async function getLearningPathBySlug(slug) {
	const { data } = await api.get(`/learning-paths/${slug}`);
	return data?.data;
}

// Creates a new learning path.
export async function createLearningPath(payload) {
	const { data } = await api.post('/learning-paths', payload);
	return data?.data;
}

// Updates an existing learning path identified by slug.
export async function updateLearningPath(slug, payload) {
	const { data } = await api.put(`/learning-paths/${slug}`, payload);
	return data?.data;
}

// Deletes a learning path identified by slug.
export async function deleteLearningPath(slug) {
	await api.delete(`/learning-paths/${slug}`);
}

// ─── Service Lines ───

// Fetches a filtered list of service lines.
export async function getServiceLines(params = {}) {
	const { data } = await api.get('/service-lines', { params });
	return data?.data || [];
}

// Fetches a single service line by its slug.
export async function getServiceLineBySlug(slug) {
	const { data } = await api.get(`/service-lines/${slug}`);
	return data?.data;
}

// Creates a new service line.
export async function createServiceLine(payload) {
	const { data } = await api.post('/service-lines', payload);
	return data?.data;
}

// Updates an existing service line identified by slug.
export async function updateServiceLine(slug, payload) {
	const { data } = await api.put(`/service-lines/${slug}`, payload);
	return data?.data;
}

// Deletes a service line identified by slug.
export async function deleteServiceLine(slug) {
	await api.delete(`/service-lines/${slug}`);
}

// ─── Areas ───

// Fetches a filtered list of areas.
export async function getAreas(params = {}) {
	const { data } = await api.get('/areas', { params });
	return data?.data || [];
}

// Fetches a single area by its slug.
export async function getAreaBySlug(slug) {
	const { data } = await api.get(`/areas/${slug}`);
	return data?.data;
}

// Creates a new area.
export async function createArea(payload) {
	const { data } = await api.post('/areas', payload);
	return data?.data;
}

// Updates an existing area identified by slug.
export async function updateArea(slug, payload) {
	const { data } = await api.put(`/areas/${slug}`, payload);
	return data?.data;
}

// Deletes an area identified by slug.
export async function deleteArea(slug) {
	await api.delete(`/areas/${slug}`);
}

// ─── Levels (Progression Stages) ───

// Fetches a filtered list of levels (progression stages).
export async function getLevels(params = {}) {
	const { data } = await api.get('/levels', { params });
	return data?.data || [];
}

// Fetches a single level by its stage code.
export async function getLevelByCode(stageCode) {
	const { data } = await api.get(`/levels/${stageCode}`);
	return data?.data;
}

// Creates a new level (progression stage).
export async function createLevel(payload) {
	const { data } = await api.post('/levels', payload);
	return data?.data;
}

// Updates an existing level identified by stage code.
export async function updateLevel(stageCode, payload) {
	const { data } = await api.put(`/levels/${stageCode}`, payload);
	return data?.data;
}

// Deletes a level identified by stage code.
export async function deleteLevel(stageCode) {
	await api.delete(`/levels/${stageCode}`);
}
