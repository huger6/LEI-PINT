import api from '../../../services/api';

// Latest active policy of a given type ('Privacy' | 'Terms' | 'Cookies').
export async function getLatestPolicy(type) {
	const { data } = await api.get(`/gdpr/policies/latest/${type}`);
	return data?.data;
}

// Current user's consent history (most recent first).
export async function getConsentHistory() {
	const { data } = await api.get('/gdpr/consent/history');
	return data?.data || [];
}

// Record a consent decision for a policy. action: 'ACCEPTED' | 'REVOKED'.
export async function recordConsent(policyId, action = 'ACCEPTED') {
	const { data } = await api.post('/gdpr/consent', { policy_id: policyId, action });
	return data?.data;
}
