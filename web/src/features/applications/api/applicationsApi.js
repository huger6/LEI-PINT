import api from '../../../services/api';

export async function getApplications(params = {}) {
	const { data } = await api.get('/applications', { params });
	return data?.data || [];
}

// Same endpoint as getApplications but preserves the pagination metadata.
export async function getApplicationsPaged(params = {}) {
	const { data } = await api.get('/applications', { params });
	return { data: data?.data || [], pagination: data?.pagination || null };
}

export async function getApplicationById(guid) {
	const { data } = await api.get(`/applications/${guid}`);
	return data?.data;
}

export async function startApplication(badgeId, goalId = null) {
	const { data } = await api.post('/applications/start', { badgeId, goalId });
	return data?.data;
}

export async function getUploadUrl(applicationGuid, requirementId, fileName, contentType, fileSize) {
	const { data } = await api.post(`/applications/${applicationGuid}/upload-url`, {
		requirementId,
		fileName,
		contentType,
		fileSize,
	});
	return data?.data;
}

export async function upsertEvidence(applicationGuid, payload) {
	const { data } = await api.post(`/applications/${applicationGuid}/evidences`, payload);
	return data?.data;
}

export async function submitApplication(applicationGuid, consultantNotes = null) {
	const { data } = await api.post(`/applications/${applicationGuid}/submit`, { consultantNotes });
	return data?.data;
}

export async function deleteApplication(applicationGuid) {
	await api.delete(`/applications/${applicationGuid}`);
}

export async function updateApplication(applicationGuid, payload) {
	const { data } = await api.patch(`/applications/${applicationGuid}`, payload);
	return data?.data;
}

export async function downloadEvidence(applicationGuid, evidenceId) {
	const { data } = await api.get(`/applications/${applicationGuid}/evidences/${evidenceId}/download`);
	return data?.data;
}

// Reviewer actions (Talent Manager / Service Line Leader / Administrator)
export async function validateApplication(applicationGuid, action, reviewerNotes = null) {
	const { data } = await api.put(`/applications/${applicationGuid}/validate`, { action, reviewerNotes });
	return data?.data;
}

export async function reviewEvidence(applicationGuid, evidenceId, approved, reviewNotes = null) {
	const { data } = await api.put(
		`/applications/${applicationGuid}/evidences/${evidenceId}/review`,
		{ approved, reviewNotes }
	);
	return data?.data;
}

export async function generateCertificate(applicationGuid, lang = 'en') {
	const { data } = await api.post(`/applications/${applicationGuid}/certificate`, { lang });
	return data?.data;
}
