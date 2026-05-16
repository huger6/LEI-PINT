import api from '../../../services/api';

export const EMPTY_STRUCTURE_COUNTS = {
	learningPaths: { active: 0, inactive: 0 },
	serviceLines: { active: 0, inactive: 0 },
	areas: { active: 0, inactive: 0 },
	stages: { active: 0, inactive: 0 },
};

const STRUCTURE_COUNT_ENDPOINTS = {
	learningPaths: '/learning-paths/count',
	serviceLines: '/service-lines/count',
	areas: '/areas/count',
	stages: '/levels/count',
};

async function getCountData(endpoint) {
	const { data } = await api.get(endpoint);
	const rawActive = data?.data?.active;
	const rawInactive = data?.data?.inactive;
	return {
		active: Number.isFinite(rawActive) ? rawActive : Number(rawActive) || 0,
		inactive: Number.isFinite(rawInactive) ? rawInactive : Number(rawInactive) || 0,
	};
}

export async function getLearningPathsCount() {
	return getCountData(STRUCTURE_COUNT_ENDPOINTS.learningPaths);
}

export async function getServiceLinesCount() {
	return getCountData(STRUCTURE_COUNT_ENDPOINTS.serviceLines);
}

export async function getAreasCount() {
	return getCountData(STRUCTURE_COUNT_ENDPOINTS.areas);
}

export async function getStagesCount() {
	return getCountData(STRUCTURE_COUNT_ENDPOINTS.stages);
}

export async function getAllStructureCounts() {
	const keys = Object.keys(STRUCTURE_COUNT_ENDPOINTS);
	const values = await Promise.all(keys.map((key) => getCountData(STRUCTURE_COUNT_ENDPOINTS[key])));

	return keys.reduce((acc, key, index) => {
		acc[key] = values[index];
		return acc;
	}, { ...EMPTY_STRUCTURE_COUNTS });
}
