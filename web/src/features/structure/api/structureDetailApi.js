import api from '../../../services/api';

export async function fetchLearningPathBySlug(slug) {
	const { data } = await api.get(`/learning-paths/${slug}`);
	return data?.data || null;
}

export async function fetchServiceLinesByLearningPath(lpSlug, { page = 1, limit = 50 } = {}) {
	const { data } = await api.get(`/learning-paths/${lpSlug}/service-lines`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

export async function fetchServiceLineBySlug(slug) {
	const { data } = await api.get(`/service-lines/${slug}`);
	return data?.data || null;
}

export async function fetchAreasByServiceLine(slSlug, { page = 1, limit = 50 } = {}) {
	const { data } = await api.get(`/service-lines/${slSlug}/areas`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

export async function fetchAreaBySlug(slug) {
	const { data } = await api.get(`/areas/${slug}`);
	return data?.data || null;
}

export async function fetchLevelsByArea(areaSlug, { page = 1, limit = 50 } = {}) {
	const { data } = await api.get(`/areas/${areaSlug}/levels`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}

export async function fetchLevelByCode(stageCode) {
	const { data } = await api.get(`/levels/${stageCode}`);
	const items = data?.data || [];
	return items.length > 0 ? items[0] : null;
}

export async function fetchBadgesByLevel(stageCode, { page = 1, limit = 50 } = {}) {
	const { data } = await api.get(`/levels/${stageCode}/badges`, {
		params: { page, limit }
	});
	return {
		items: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1 },
	};
}
