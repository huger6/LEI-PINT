import api from '../../../services/api';

// General reporting (Service Line Leader / Talent Manager / Administrator)
export async function getBadgesByServiceLine() {
	const { data } = await api.get('/statistics/reports/badges-by-service-line');
	return data?.data || [];
}

export async function getBadgesByLearningPath() {
	const { data } = await api.get('/statistics/reports/badges-by-learning-path');
	return data?.data || [];
}

export async function getLevelDistribution() {
	const { data } = await api.get('/statistics/reports/level-distribution');
	return data?.data || [];
}

export async function getUserEnrollment() {
	const { data } = await api.get('/statistics/reports/user-enrollment');
	return data?.data || null;
}

// Team scope KPIs
export async function getPendingApplicationsCount() {
	const { data } = await api.get('/statistics/team/applications-pending');
	return data?.data?.total ?? 0;
}

export async function getTeamBadgesCount(params = {}) {
	const { data } = await api.get('/statistics/team/badges-count', { params });
	return {
		totalBadges: data?.data?.total_badges ?? 0,
		distinctConsultants: data?.data?.distinct_consultants ?? 0,
	};
}

// Awarded badges expiring within `withinDays` (Talent Manager / Administrator)
export async function getExpiringBadges(withinDays = 90) {
	const { data } = await api.get('/statistics/reports/expiring-badges', { params: { withinDays } });
	return data?.data || [];
}
