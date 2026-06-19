import api from '../../../services/api';

// Global (platform-wide) notification preferences — Administrator only.
// Each row carries its notification_definitions under `definition`.
export async function getGlobalPreferences() {
	const { data } = await api.get('/admin/notification-preferences');
	return data?.data || [];
}

// payload: { send_email?, send_push?, is_enabled?, trigger_before_value?, trigger_before_unit? }
export async function updateGlobalPreference(preferenceId, payload) {
	const { data } = await api.put(`/admin/notification-preferences/${preferenceId}`, payload);
	return data?.data;
}
