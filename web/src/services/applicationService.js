import api from './api';

export async function getApplications(params = {}) {
	const { data } = await api.get('/applications', { params });
	return data?.data || [];
}

export async function getApplicationById(guid) {
	const { data } = await api.get(`/applications/${guid}`);
	return data?.data;
}

export async function startApplication(badgeId, goalId = null) {
	const { data } = await api.post('/applications/start', { badgeId, goalId });
	return data?.data;
}

export async function getUploadUrl(applicationGuid, requirementId, fileName) {
	const { data } = await api.post(`/applications/${applicationGuid}/upload-url`, {
		requirementId,
		fileName,
	});
	return data?.data;
}

export async function upsertEvidence(applicationGuid, payload) {
	const { data } = await api.post(`/applications/${applicationGuid}/evidences`, payload);
	return data?.data;
}

export async function submitApplication(applicationGuid) {
	const { data } = await api.post(`/applications/${applicationGuid}/submit`);
	return data?.data;
}
