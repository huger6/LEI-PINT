// Badge application lifecycle: creation, evidence upload, and submission.
import api from './api';

export async function getApplications(params = {}) {
	const { data } = await api.get('/applications', { params });
	return data?.data || [];
}

export async function getApplicationById(guid) {
	const { data } = await api.get(`/applications/${guid}`);
	return data?.data;
}

// Creates a new badge application. Optionally links it to a goal.
export async function startApplication(badgeId, goalId = null) {
	const { data } = await api.post('/applications/start', { badgeId, goalId });
	return data?.data;
}

// Gets a pre-signed upload URL for a specific requirement's evidence file.
export async function getUploadUrl(applicationGuid, requirementId, fileName) {
	const { data } = await api.post(`/applications/${applicationGuid}/upload-url`, {
		requirementId,
		fileName,
	});
	return data?.data;
}

// Creates or updates evidence metadata for an application's requirement.
export async function upsertEvidence(applicationGuid, payload) {
	const { data } = await api.post(`/applications/${applicationGuid}/evidences`, payload);
	return data?.data;
}

// Transitions the application from Open to Submitted for Talent Manager review.
export async function submitApplication(applicationGuid) {
	const { data } = await api.post(`/applications/${applicationGuid}/submit`);
	return data?.data;
}
