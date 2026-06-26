// API for fetching detailed structure entities (learning paths, service lines, areas, levels).
import api from '../../../services/api';

// Fetches a single learning path by its slug.
export async function fetchLearningPathBySlug(slug) {
	const { data } = await api.get(`/learning-paths/${slug}`);
	return data?.data || null;
}

// Fetches a paginated list of service lines under a learning path.
export async function fetchServiceLinesByLearningPath(lpSlug, { page = 1, limit = 32 } = {}) {
	const { data } = await api.get(`/learning-paths/${lpSlug}/service-lines`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

// Fetches a single service line by its slug.
export async function fetchServiceLineBySlug(slug) {
	const { data } = await api.get(`/service-lines/${slug}`);
	return data?.data || null;
}

// Fetches a paginated list of areas under a service line.
export async function fetchAreasByServiceLine(slSlug, { page = 1, limit = 32 } = {}) {
	const { data } = await api.get(`/service-lines/${slSlug}/areas`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

// Fetches a single area by its slug.
export async function fetchAreaBySlug(slug) {
	const { data } = await api.get(`/areas/${slug}`);
	return data?.data || null;
}

// Fetches a paginated list of progression levels under an area.
export async function fetchLevelsByArea(areaSlug, { page = 1, limit = 32 } = {}) {
	const { data } = await api.get(`/areas/${areaSlug}/levels`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

// Fetches a single level within an area by its stage code.
export async function fetchLevelByCode(areaSlug, stageCode) {
	const { data } = await api.get(`/areas/${areaSlug}/levels/${stageCode}`);
	return data?.data || null;
}

// Fetches a paginated list of badges for a given level within an area.
export async function fetchBadgesByLevel(areaSlug, stageCode, { page = 1, limit = 32 } = {}) {
	const { data } = await api.get(`/areas/${areaSlug}/levels/${stageCode}/badges`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

