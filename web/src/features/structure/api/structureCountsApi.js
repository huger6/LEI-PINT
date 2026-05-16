import api from '../../../services/api';

export const EMPTY_STRUCTURE_COUNTS = {
	learningPaths: 0,
	serviceLines: 0,
	areas: 0,
	stages: 0,
};

const STRUCTURE_COUNT_ENDPOINTS = {
	learningPaths: '/learning-paths/count',
	serviceLines: '/service-lines/count',
	areas: '/areas/count',
	stages: '/levels/count',
};

async function getCount(endpoint) {
	const { data } = await api.get(endpoint);
	const rawCount = data?.data?.count;
	return Number.isFinite(rawCount) ? rawCount : Number(rawCount) || 0;
}

export async function getLearningPathsCount() {
	return getCount(STRUCTURE_COUNT_ENDPOINTS.learningPaths);
}

export async function getServiceLinesCount() {
	return getCount(STRUCTURE_COUNT_ENDPOINTS.serviceLines);
}

export async function getAreasCount() {
	return getCount(STRUCTURE_COUNT_ENDPOINTS.areas);
}

export async function getStagesCount() {
	return getCount(STRUCTURE_COUNT_ENDPOINTS.stages);
}

export async function getAllStructureCounts() {
	const keys = Object.keys(STRUCTURE_COUNT_ENDPOINTS);
	const values = await Promise.all(keys.map((key) => getCount(STRUCTURE_COUNT_ENDPOINTS[key])));

	return keys.reduce((acc, key, index) => {
		acc[key] = values[index];
		return acc;
	}, { ...EMPTY_STRUCTURE_COUNTS });
}
