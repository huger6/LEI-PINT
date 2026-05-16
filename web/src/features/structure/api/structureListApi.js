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

export async function fetchServiceLines({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/service-lines', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchAreas({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/areas', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}

export async function fetchLevels({ page = 1, limit = 12, search, status } = {}) {
	const { data } = await api.get('/levels', { params: buildParams({ page, limit, search, status }) });
	return parseResponse(data);
}
