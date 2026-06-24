// Gamification API: points, streaks, achievements, and leaderboard data.
import api from '../../../services/api';

export async function toggleFavorite(badgeSlug) {
	const { data } = await api.post(`/gamification/favorites/${badgeSlug}`);
	return data?.data;
}

export async function getFavorites() {
	const { data } = await api.get('/gamification/favorites');
	return data?.data || [];
}

// Toggle whether an earned badge appears on the consultant's public profile.
export async function setBadgeFeatured(verificationLink, featured) {
	const { data } = await api.patch(`/gamification/earned-badges/${verificationLink}/featured`, { featured });
	return data?.data;
}

export async function trackInteraction(badgeId, interactionType) {
	const { data } = await api.post('/gamification/interactions', {
		badgeId,
		interactionType,
	});
	return data?.data;
}
