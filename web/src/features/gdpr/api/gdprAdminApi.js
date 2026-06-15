import api from '../../../services/api';

// Lists the currently active policies (one per type/version). Creating a new
// version deactivates the previous one, so this reflects the live set.
export async function getPolicies() {
	const { data } = await api.get('/gdpr/policies');
	return data?.data || [];
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
