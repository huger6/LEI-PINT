// API for external integrations management (e.g. LinkedIn, Credly).
import api from '../../../services/api';

// Outbound integration webhooks (Microsoft Teams) — Administrator only.
// Each row: { webhook_id, platform, channel_name, is_active, created_at }.
export async function getWebhooks() {
	const { data } = await api.get('/integrations');
	return data?.data || [];
}

// payload: { platform: 'teams', webhook_url, channel_name? }
export async function createWebhook(payload) {
	const { data } = await api.post('/integrations', payload);
	return data?.data;
}

export async function deleteWebhook(id) {
	const { data } = await api.delete(`/integrations/${id}`);
	return data;
}

export async function toggleWebhook(id) {
	const { data } = await api.patch(`/integrations/${id}/toggle`);
	return data?.data;
}

// Sends a test message to the configured webhook URL.
export async function testWebhook(id) {
	const { data } = await api.post(`/integrations/${id}/test`);
	return data;
}
