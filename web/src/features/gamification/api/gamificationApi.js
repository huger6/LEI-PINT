// Gamification API: points, streaks, achievements, and leaderboard data.
import api from '../../../services/api';

// Toggles the favorite state of a badge for the current consultant.
export async function toggleFavorite(badgeSlug) {
	const { data } = await api.post(`/gamification/favorites/${badgeSlug}`);
	return data?.data;
}

// Fetches the current consultant's list of favorited badges.
export async function getFavorites() {
	const { data } = await api.get('/gamification/favorites');
	return data?.data || [];
}

// Toggle whether an earned badge appears on the consultant's public profile.
export async function setBadgeFeatured(verificationLink, featured) {
	const { data } = await api.patch(`/gamification/earned-badges/${verificationLink}/featured`, { featured });
	return data?.data;
}

// Records a consultant interaction event (view, click) for a badge.
export async function trackInteraction(badgeId, interactionType) {
	const { data } = await api.post('/gamification/interactions', {
		badgeId,
		interactionType,
	});
	return data?.data;
}

// Read-only gamification snapshot for leadership roles: points-per-badge,
// available rewards, and badge milestones. Points are SL-scoped for an SLL.
export async function getGamificationOverview() {
	const { data } = await api.get('/gamification/overview');
	return data?.data;
}
