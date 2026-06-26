// API for goal-related statistics.
import api from '../../../services/api';

// Fetches the consultant's progress percentage across all learning paths.
export async function getLearningPathProgress() {
	const { data } = await api.get('/statistics/consultant/learning-paths');
	return data?.data || [];
}
