import api from '../../../services/api';

// General reporting (Service Line Leader / Talent Manager / Administrator).
// Optional params: serviceLineId, areaId, dateFrom, dateTo.
export async function getBadgesByServiceLine(params = {}) {
	const { data } = await api.get('/statistics/reports/badges-by-service-line', { params });
	return data?.data || [];
}

export async function getBadgesByLearningPath(params = {}) {
	const { data } = await api.get('/statistics/reports/badges-by-learning-path', { params });
	return data?.data || [];
}

export async function getLevelDistribution(params = {}) {
	const { data } = await api.get('/statistics/reports/level-distribution', { params });
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

// Consultants overview (leadership). SLL is scoped server-side to their Service Line.
// params: search, serviceLineId, areaId, pointsMin, pointsMax, sort, page, limit
export async function getConsultantsOverview(params = {}) {
	const { data } = await api.get('/statistics/consultants', { params });
	return { rows: data?.data || [], pagination: data?.pagination || null };
}

// Badge KPI summary (leadership). SLL scoped server-side.
// params: serviceLineId, areaId, dateFrom, dateTo
export async function getBadgesSummary(params = {}) {
	const { data } = await api.get('/statistics/badges-summary', { params });
	return data?.data || { total: 0, standard: 0, premium: 0, accepted: 0, rejected: 0, approvalRate: 0 };
}

// A consultant's acquisition timeline (badges/points per month + cumulative).
// Leaders pass userGuid to inspect a specific consultant.
export async function getAcquisitionTimeline(userGuid) {
	const { data } = await api.get('/statistics/consultant/timeline', { params: userGuid ? { userGuid } : {} });
	return data?.data || [];
}

// Peer comparison for a consultant (same area + similar tenure).
export async function getPeerComparison(userGuid, tolerance) {
	const params = {};
	if (userGuid) params.userGuid = userGuid;
	if (tolerance != null) params.tolerance = tolerance;
	const { data } = await api.get('/statistics/consultants/comparison', { params });
	return data?.data || { target: null, peers: [], peerCount: 0, averages: { points: 0, badges: 0 } };
}
