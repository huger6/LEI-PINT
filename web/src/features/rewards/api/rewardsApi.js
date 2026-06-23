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
