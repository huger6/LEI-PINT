// Admin GDPR management API: consent tracking and data deletion requests.
import api from '../../../services/api';

// Admin management list: every policy of every type, active AND inactive, so
// the full version history is visible (the public /gdpr/policies returns only
// the active set, one per type).
export async function getPolicies() {
	const { data } = await api.get('/gdpr/admin/policies');
	return data?.data || [];
}

// Reactivate a specific (inactive) version — becomes the single active one of its type.
export async function activatePolicy(policyId) {
	const { data } = await api.patch(`/gdpr/admin/policies/${policyId}/activate`);
	return data?.data;
}

// Aggregate RGPD acceptance across consultants: { total, accepted, pending }.
export async function getConsentSummary() {
	const { data } = await api.get('/gdpr/admin/consent-summary');
	return data?.data || null;
}

// payload: { policy_type: 'Privacy'|'Terms'|'Cookies', version, policy_text, is_mandatory? }
export async function createPolicy(payload) {
	const { data } = await api.post('/gdpr/admin/policies', payload);
	return data?.data;
}

// payload: { is_mandatory?, is_active? }
export async function updatePolicy(policyId, payload) {
	const { data } = await api.put(`/gdpr/admin/policies/${policyId}`, payload);
	return data?.data;
}

export async function deactivatePolicy(policyId) {
	const { data } = await api.patch(`/gdpr/admin/policies/${policyId}/deactivate`);
	return data;
}

// payload: { policy_text, version, is_mandatory? }
export async function newPolicyVersion(policyId, payload) {
	const { data } = await api.post(`/gdpr/admin/policies/${policyId}/new-version`, payload);
	return data?.data;
}
