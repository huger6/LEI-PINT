import api from './api';

export async function getConsultantStats() {
	const { data } = await api.get('/gamification/consultant-stats');
	return data?.data;
}

export async function getPointsSummary() {
	const { data } = await api.get('/gamification/points');
	return data?.data;
}

export async function getPointsHistory(params = {}) {
	const { data } = await api.get('/statistics/consultant/points-history', { params });
	return {
		totalPoints: data?.data?.totalPoints,
		history: data?.data?.history || [],
		pagination: data?.pagination,
	};
}

export async function getPointsHistoryAll() {
	const { data } = await api.get('/statistics/consultant/points-history', {
		params: { page: 1, limit: 100 },
	});
	return data?.data?.history || [];
}

export async function getEarnedBadges(params = {}) {
	const { data } = await api.get('/gamification/earned-badges', { params });
	return {
		badges: data?.data || [],
		pagination: data?.pagination,
	};
}

export async function getRecommendations(params = {}) {
	const { data } = await api.get('/gamification/recommendations', { params });
	return {
		recommendations: data?.data || [],
		pagination: data?.pagination,
	};
}

export async function getLearningPathProgress() {
	const { data } = await api.get('/statistics/consultant/learning-paths');
	return data?.data || [];
}

export async function getRanking(params = {}) {
	const { data } = await api.get('/ranking', { params });
	return {
		rankings: data?.data || [],
		pagination: data?.pagination,
	};
}
