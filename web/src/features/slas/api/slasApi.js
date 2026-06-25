// API for SLA (Service Level Agreement) configuration and monitoring.
import api from '../../../services/api';

// Returns { data, pagination }. Admins may pass isActive=false to see inactive SLAs.
export async function getSLAs(params = {}) {
	const { data } = await api.get('/slas', { params });
	return {
		data: data?.data || [],
		pagination: data?.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 }
	};
}

// Fetches a single SLA configuration by its ID.
export async function getSLAById(slaId) {
	const { data } = await api.get(`/slas/${slaId}`);
	return data?.data;
}

// Creates a new SLA configuration with the supplied payload.
export async function createSLA(payload) {
	const { data } = await api.post('/slas', payload);
	return data?.data;
}

// Updates an existing SLA configuration by its ID.
export async function updateSLA(slaId, payload) {
	const { data } = await api.put(`/slas/${slaId}`, payload);
	return data?.data;
}

// Deletes an SLA configuration by its ID.
export async function deleteSLA(slaId) {
	await api.delete(`/slas/${slaId}`);
}
