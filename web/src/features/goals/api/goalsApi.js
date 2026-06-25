// API for consultant learning objectives/goals.
import api from '../../../services/api';

// Fetches all active learning goals for the current consultant.
export async function getGoals() {
	const { data } = await api.get('/goals');
	return data?.data || [];
}

// Fetches goal-level KPI counters (active, completed, expiring, days to next deadline).
export async function getGoalStats() {
	const { data } = await api.get('/goals/stats');
	return data?.data || {
		active_objectives: 0,
		days_to_next: 0,
		badges_expiring: 0,
		completed_objectives: 0
	};
}

// Fetches the consultant's chronological progression timeline events.
export async function getProgressionTimeline() {
	const { data } = await api.get('/goals/timeline');
	return data?.data || [];
}

// Downloads the objectives as an .ics calendar and triggers "save as" so the
// user can add them to Teams / Outlook / any calendar app.
export async function downloadObjectivesCalendar() {
	const res = await api.get('/goals/calendar', { responseType: 'blob' });
	const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/calendar' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'objetivos-softinsa.ics';
	document.body.appendChild(link);
	link.click();
	setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 1500);
}

// Creates a new learning goal for the current consultant.
export async function createGoal(payload) {
	const { data } = await api.post('/goals', payload);
	return data?.data;
}

// Updates a specific goal's properties by its ID.
export async function updateGoal(goalId, payload) {
	const { data } = await api.put(`/goals/${goalId}`, payload);
	return data?.data;
}

// Deletes a learning goal by its ID.
export async function deleteGoal(goalId) {
	await api.delete(`/goals/${goalId}`);
}
