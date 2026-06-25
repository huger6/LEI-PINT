// Consultant gamification data: points summary, history, earned badges, ranking, and recommendations.
import api from './api';

// Fetches the consultant's aggregated gamification stats.
export async function getConsultantStats() {
	const { data } = await api.get('/gamification/consultant-stats');
	return data?.data;
}

// Fetches the consultant's current points summary.
export async function getPointsSummary() {
	const { data } = await api.get('/gamification/points');
	return data?.data;
}

// Fetches a paginated page of the consultant's points history.
export async function getPointsHistory(params = {}) {
	const { data } = await api.get('/statistics/consultant/points-history', { params });
	return {
		totalPoints: data?.data?.totalPoints,
		history: data?.data?.history || [],
		pagination: data?.pagination,
	};
}

// Fetches the consultant's full points history (first 100 entries).
export async function getPointsHistoryAll() {
	const { data } = await api.get('/statistics/consultant/points-history', {
		params: { page: 1, limit: 100 },
	});
	return data?.data?.history || [];
}

// Fetches the consultant's earned badges (paginated).
export async function getEarnedBadges(params = {}) {
	const { data } = await api.get('/gamification/earned-badges', { params });
	return {
		badges: data?.data || [],
		pagination: data?.pagination,
	};
}

// Fetches recommended next badges for the consultant (paginated).
export async function getRecommendations(params = {}) {
	const { data } = await api.get('/gamification/recommendations', { params });
	return {
		recommendations: data?.data || [],
		pagination: data?.pagination,
	};
}

// Fetches the consultant's progress across learning paths.
export async function getLearningPathProgress() {
	const { data } = await api.get('/statistics/consultant/learning-paths');
	return data?.data || [];
}

// Fetches the points-based ranking leaderboard (paginated).
export async function getRanking(params = {}) {
	const { data } = await api.get('/ranking', { params });
	return {
		rankings: data?.data || [],
		pagination: data?.pagination,
	};
}

// Fetches the current consultant's position within the ranking.
export async function getMyRankingPosition(params = {}) {
	const { data } = await api.get('/ranking/my-position', { params });
	return data?.data;
}
