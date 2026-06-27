// API for the consultant rewards store (points redemption).
import api from '../../../services/api';

// Points store for the consultant: active rewards + current balance.
export async function getRewards() {
	const { data } = await api.get('/rewards');
	return data?.data || { balance: 0, redeemedGuids: [], rewards: [] };
}

// The consultant's redemption history (with access links/info).
export async function getRedemptions() {
	const { data } = await api.get('/rewards/redemptions');
	return data?.data || [];
}

// Spend points to redeem a reward; returns the access info (also emailed).
export async function redeemReward(rewardGuid) {
	const { data } = await api.post(`/rewards/${rewardGuid}/redeem`);
	return data?.data;
}

// Titles the consultant has unlocked + the one currently displayed.
export async function getTitles() {
	const { data } = await api.get('/rewards/titles');
	return data?.data || { titles: [], activeTitle: null, activeTitleRewardGuid: null };
}

// Set (or clear with null) the consultant's publicly displayed title.
export async function setActiveTitle(rewardGuid) {
	const { data } = await api.patch('/rewards/active-title', { rewardGuid });
	return data?.data;
}

// ── Admin reward management ──────────────────────────────────────────────
// All store rewards (active + inactive) for the admin.
export async function adminListRewards() {
	const { data } = await api.get('/rewards/admin');
	return data?.data || [];
}

// Create a store reward.
export async function createReward(payload) {
	const { data } = await api.post('/rewards', payload);
	return data?.data;
}

// Update a store reward.
export async function updateReward(rewardGuid, payload) {
	const { data } = await api.put(`/rewards/${rewardGuid}`, payload);
	return data?.data;
}

// Deactivate (soft-delete) a store reward.
export async function deleteReward(rewardGuid) {
	const { data } = await api.delete(`/rewards/${rewardGuid}`);
	return data?.data;
}
