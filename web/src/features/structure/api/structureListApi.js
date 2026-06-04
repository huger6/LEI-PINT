import api from '../../../services/api';

const DEFAULT_PAGINATION = { totalItems: 0, totalPages: 1, currentPage: 1 };

function buildParams({ page, limit, search, status }) {
	const params = { page, limit };
	if (search) params.search = search;
	if (status === 'active') params.is_active = true;
	else if (status === 'inactive') params.is_active = false;
	return params;
}

function parseResponse(data) {
	return {
		items: data?.data || [],
		pagination: data?.pagination || DEFAULT_PAGINATION,
	};
}

export async function fetchLearningPaths({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/learning-paths', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchAllLearningPaths({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/learning-paths', { params });
	return parseResponse(data);
}

export async function fetchLearningPathsFilterStats() {
	const { data } = await api.get('/learning-paths/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxServiceLineCount: 0 };
}

export async function checkLearningPathSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/learning-path', { params: { value } });
	return data?.data ?? { available: false };
}

export async function createLearningPath(payload) {
	const { data } = await api.post('/learning-paths', payload);
	return data?.data;
}

export async function updateLearningPath(slug, payload) {
	const { data } = await api.put(`/learning-paths/${slug}`, payload);
	return data?.data;
}

export async function fetchServiceLines({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/service-lines', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchAllServiceLines({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/service-lines', { params });
	return parseResponse(data);
}

export async function fetchServiceLinesFilterStats() {
	const { data } = await api.get('/service-lines/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxAreaCount: 0 };
}

export async function checkServiceLineSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/service-line', { params: { value } });
	return data?.data ?? { available: false };
}

export async function createServiceLine(payload) {
	const { data } = await api.post('/service-lines', payload);
	return data?.data;
}

export async function updateServiceLine(slug, payload) {
	const { data } = await api.put(`/service-lines/${slug}`, payload);
	return data?.data;
}

export async function fetchAreas({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/areas', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchAllAreas({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/areas', { params });
	return parseResponse(data);
}

export async function fetchAreasFilterStats() {
	const { data } = await api.get('/areas/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxLevelCount: 0 };
}

export async function checkAreaSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/area', { params: { value } });
	return data?.data ?? { available: false };
}

export async function createArea(payload) {
	const { data } = await api.post('/areas', payload);
	return data?.data;
}

export async function updateArea(slug, payload) {
	const { data } = await api.put(`/areas/${slug}`, payload);
	return data?.data;
}

export async function fetchLevels({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/levels', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchAllLevels({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/levels', { params });
	return parseResponse(data);
}

export async function fetchLevelsFilterStats() {
	const { data } = await api.get('/levels/filter-stats');
	return data?.data || { maxConsultantCount: 0 };
}

export async function deleteLearningPath(slug) {
	const { data } = await api.delete(`/learning-paths/${slug}`);
	return data;
}

export async function deleteServiceLine(slug) {
	const { data } = await api.delete(`/service-lines/${slug}`);
	return data;
}

export async function deleteArea(slug) {
	const { data } = await api.delete(`/areas/${slug}`);
	return data;
}

export async function deleteBadge(slug) {
	const { data } = await api.delete(`/badges/${slug}`);
	return data;
}

export async function activateLearningPath(slug) {
	const { data } = await api.patch(`/learning-paths/${slug}/activate`);
	return data;
}

export async function activateServiceLine(slug) {
	const { data } = await api.patch(`/service-lines/${slug}/activate`);
	return data;
}

export async function activateArea(slug) {
	const { data } = await api.patch(`/areas/${slug}/activate`);
	return data;
}

export async function createLevel(payload) {
	const { data } = await api.post('/levels', payload);
	return data?.data;
}

export async function updateLevel(stageCode, payload) {
	const { data } = await api.put(`/levels/${stageCode}`, payload);
	return data?.data;
}

export async function deleteLevel(areaSlug, stageCode) {
	const { data } = await api.delete(`/areas/${areaSlug}/levels/${stageCode}`);
	return data;
}

export async function activateLevel(areaSlug, stageCode) {
	const { data } = await api.patch(`/areas/${areaSlug}/levels/${stageCode}/activate`);
	return data;
}
