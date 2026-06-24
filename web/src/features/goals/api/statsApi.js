// API for goal-related statistics.
import api from '../../../services/api';

export async function getLearningPathProgress() {
	const { data } = await api.get('/statistics/consultant/learning-paths');
	return data?.data || [];
}
