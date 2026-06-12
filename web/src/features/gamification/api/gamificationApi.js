import api from '../../../services/api';

export async function toggleFavorite(badgeSlug) {
	const { data } = await api.post(`/gamification/favorites/${badgeSlug}`);
	return data?.data;
}

export async function getFavorites() {
	const { data } = await api.get('/gamification/favorites');
	return data?.data || [];
}

export async function trackInteraction(badgeId, interactionType) {
	const { data } = await api.post('/gamification/interactions', {
		badgeId,
		interactionType,
	});
	return data?.data;
}
