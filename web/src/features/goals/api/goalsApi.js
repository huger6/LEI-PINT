import api from '../../../services/api';

export async function getGoals() {
	const { data } = await api.get('/goals');
	return data?.data || [];
}

export async function getGoalStats() {
	const { data } = await api.get('/goals/stats');
	return data?.data || {
		active_objectives: 0,
		days_to_next: 0,
		badges_expiring: 0,
		completed_objectives: 0
	};
}

export async function getProgressionTimeline() {
	const { data } = await api.get('/goals/timeline');
	return data?.data || [];
}

export async function createGoal(payload) {
	const { data } = await api.post('/goals', payload);
	return data?.data;
}

export async function updateGoal(goalId, payload) {
	const { data } = await api.put(`/goals/${goalId}`, payload);
	return data?.data;
}

export async function deleteGoal(goalId) {
	await api.delete(`/goals/${goalId}`);
}
