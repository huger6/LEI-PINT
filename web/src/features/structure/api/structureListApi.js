// API for listing structure entities with pagination and filtering.
import api from '../../../services/api';

const DEFAULT_PAGINATION = { totalItems: 0, totalPages: 1, currentPage: 1 };

// Builds query params, mapping a status string to the is_active flag.
function buildParams({ page, limit, search, status }) {
	const params = { page, limit };
	if (search) params.search = search;
	if (status === 'active') params.is_active = true;
	else if (status === 'inactive') params.is_active = false;
	return params;
}

// Normalizes a list response into items and pagination.
function parseResponse(data) {
	return {
		items: data?.data || [],
		pagination: data?.pagination || DEFAULT_PAGINATION,
	};
}

// Fetches a paginated, filterable list of learning paths.
export async function fetchLearningPaths({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/learning-paths', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

// Fetches all active learning paths (high limit) for selectors.
export async function fetchAllLearningPaths({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/learning-paths', { params });
	return parseResponse(data);
}

// Fetches max-value stats used to bound learning path filters.
export async function fetchLearningPathsFilterStats() {
	const { data } = await api.get('/learning-paths/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxServiceLineCount: 0 };
}

// Checks whether a learning path slug is available.
export async function checkLearningPathSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/learning-path', { params: { value } });
	return data?.data ?? { available: false };
}

// Creates a new learning path.
export async function createLearningPath(payload) {
	const { data } = await api.post('/learning-paths', payload);
	return data?.data;
}

// Updates a learning path by its slug.
export async function updateLearningPath(slug, payload) {
	const { data } = await api.put(`/learning-paths/${slug}`, payload);
	return data?.data;
}

// Fetches a paginated, filterable list of service lines.
export async function fetchServiceLines({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/service-lines', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

// Fetches all active service lines (high limit) for selectors.
export async function fetchAllServiceLines({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/service-lines', { params });
	return parseResponse(data);
}

// Fetches max-value stats used to bound service line filters.
export async function fetchServiceLinesFilterStats() {
	const { data } = await api.get('/service-lines/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxAreaCount: 0 };
}

// Checks whether a service line slug is available.
export async function checkServiceLineSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/service-line', { params: { value } });
	return data?.data ?? { available: false };
}

// Creates a new service line.
export async function createServiceLine(payload) {
	const { data } = await api.post('/service-lines', payload);
	return data?.data;
}

// Updates a service line by its slug.
export async function updateServiceLine(slug, payload) {
	const { data } = await api.put(`/service-lines/${slug}`, payload);
	return data?.data;
}

// Fetches a paginated, filterable list of areas.
export async function fetchAreas({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/areas', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

// Fetches all active areas (high limit) for selectors.
export async function fetchAllAreas({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/areas', { params });
	return parseResponse(data);
}

// Fetches max-value stats used to bound area filters.
export async function fetchAreasFilterStats() {
	const { data } = await api.get('/areas/filter-stats');
	return data?.data || { maxConsultantCount: 0, maxLevelCount: 0 };
}

// Checks whether an area slug is available.
export async function checkAreaSlugAvailability(value) {
	const { data } = await api.get('/utils/check/slug/area', { params: { value } });
	return data?.data ?? { available: false };
}

// Creates a new area.
export async function createArea(payload) {
	const { data } = await api.post('/areas', payload);
	return data?.data;
}

// Updates an area by its slug.
export async function updateArea(slug, payload) {
	const { data } = await api.put(`/areas/${slug}`, payload);
	return data?.data;
}

// Fetches a paginated, filterable list of progression levels.
export async function fetchLevels({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/levels', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

// Fetches all active levels (high limit) for selectors.
export async function fetchAllLevels({ search } = {}) {
	const params = { limit: 100, is_active: true };
	if (search) params.search = search;
	const { data } = await api.get('/levels', { params });
	return parseResponse(data);
}

// Fetches max-value stats used to bound level filters.
export async function fetchLevelsFilterStats() {
	const { data } = await api.get('/levels/filter-stats');
	return data?.data || { maxConsultantCount: 0 };
}

// Deletes (deactivates) a learning path by its slug.
export async function deleteLearningPath(slug) {
	const { data } = await api.delete(`/learning-paths/${slug}`);
	return data;
}

// Deletes (deactivates) a service line by its slug.
export async function deleteServiceLine(slug) {
	const { data } = await api.delete(`/service-lines/${slug}`);
	return data;
}

// Deletes (deactivates) an area by its slug.
export async function deleteArea(slug) {
	const { data } = await api.delete(`/areas/${slug}`);
	return data;
}

// Deletes a badge by its slug.
export async function deleteBadge(slug) {
	const { data } = await api.delete(`/badges/${slug}`);
	return data;
}

// Reactivates a learning path by its slug.
export async function activateLearningPath(slug) {
	const { data } = await api.patch(`/learning-paths/${slug}/activate`);
	return data;
}

// Reactivates a service line by its slug.
export async function activateServiceLine(slug) {
	const { data } = await api.patch(`/service-lines/${slug}/activate`);
	return data;
}

// Reactivates an area by its slug.
export async function activateArea(slug) {
	const { data } = await api.patch(`/areas/${slug}/activate`);
	return data;
}

// Creates a new progression level.
export async function createLevel(payload) {
	const { data } = await api.post('/levels', payload);
	return data?.data;
}

// Updates a level by its stage code.
export async function updateLevel(stageCode, payload) {
	const { data } = await api.put(`/levels/${stageCode}`, payload);
	return data?.data;
}

// Deletes a level within an area by its stage code.
export async function deleteLevel(areaSlug, stageCode) {
	const { data } = await api.delete(`/areas/${areaSlug}/levels/${stageCode}`);
	return data;
}

// Reactivates a level within an area by its stage code.
export async function activateLevel(areaSlug, stageCode) {
	const { data } = await api.patch(`/areas/${areaSlug}/levels/${stageCode}/activate`);
	return data;
}
