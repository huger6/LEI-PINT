// API calls for badge applications: listing, paging, state transitions, and evidence management.
import api from '../../../services/api';

// Fetches all applications matching the given filter params.
export async function getApplications(params = {}) {
	const { data } = await api.get('/applications', { params });
	return data?.data || [];
}

// Same endpoint as getApplications but preserves the pagination metadata.
export async function getApplicationsPaged(params = {}) {
	const { data } = await api.get('/applications', { params });
	return { data: data?.data || [], pagination: data?.pagination || null };
}

// Fetches a single application by its GUID.
export async function getApplicationById(guid) {
	const { data } = await api.get(`/applications/${guid}`);
	return data?.data;
}

// Starts a new badge application, optionally linking it to a learning goal.
export async function startApplication(badgeSlug, goalId = null) {
	const { data } = await api.post('/applications/start', { badgeSlug, goalId });
	return data?.data;
}

// Requests a pre-signed S3 URL for uploading an evidence file.
export async function getUploadUrl(applicationGuid, requirementId, fileName, contentType, fileSize) {
	const { data } = await api.post(`/applications/${applicationGuid}/upload-url`, {
		requirementId,
		fileName,
		contentType,
		fileSize,
	});
	return data?.data;
}

// Creates or updates an evidence entry for a specific application requirement.
export async function upsertEvidence(applicationGuid, payload) {
	const { data } = await api.post(`/applications/${applicationGuid}/evidences`, payload);
	return data?.data;
}

// Transitions the application to Submitted state and locks it for review.
export async function submitApplication(applicationGuid, consultantNotes = null) {
	const { data } = await api.post(`/applications/${applicationGuid}/submit`, { consultantNotes });
	return data?.data;
}

// Partially updates mutable fields on an open application.
export async function updateApplication(applicationGuid, payload) {
	const { data } = await api.patch(`/applications/${applicationGuid}`, payload);
	return data?.data;
}

// Returns a temporary download URL for an evidence file.
export async function downloadEvidence(applicationGuid, evidenceId) {
	const { data } = await api.get(`/applications/${applicationGuid}/evidences/${evidenceId}/download`);
	return data?.data;
}

// Returns a temporary inline preview URL for an evidence file.
export async function previewEvidence(applicationGuid, evidenceId) {
	const { data } = await api.get(`/applications/${applicationGuid}/evidences/${evidenceId}/preview`);
	return data?.data;
}

// Removes an uploaded evidence file (owner only, while the application is Open).
export async function deleteEvidence(applicationGuid, evidenceId) {
	const { data } = await api.delete(`/applications/${applicationGuid}/evidences/${evidenceId}`);
	return data;
}

// Reviewer actions (Talent Manager / Service Line Leader / Administrator)
// Advances or reverts the application workflow state (validate/reject/return).
export async function validateApplication(applicationGuid, action, reviewerNotes = null) {
	const { data } = await api.put(`/applications/${applicationGuid}/validate`, { action, reviewerNotes });
	return data?.data;
}

// Marks a single evidence item as approved or rejected by the reviewer.
export async function reviewEvidence(applicationGuid, evidenceId, approved, reviewNotes = null) {
	const { data } = await api.put(
		`/applications/${applicationGuid}/evidences/${evidenceId}/review`,
		{ approved, reviewNotes }
	);
	return data?.data;
}

// Generates and returns a certificate PDF link for an accepted application.
export async function generateCertificate(applicationGuid, lang = 'en') {
	const { data } = await api.post(`/applications/${applicationGuid}/certificate`, { lang });
	return data?.data;
}
