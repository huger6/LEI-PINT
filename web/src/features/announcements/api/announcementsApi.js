// API calls for platform-wide announcements (CRUD + toggle active state).
import api from '../../../services/api';

// Fetches a paginated list of announcements with optional filter params.
export async function getAnnouncements(params = {}) {
    const { data } = await api.get('/announcements', { params });
    return {
        data: data?.data || [],
        pagination: data?.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 }
    };
}

// Fetches a single announcement by its ID.
export async function getAnnouncementById(announcementId) {
    const { data } = await api.get(`/announcements/${announcementId}`);
    return data?.data;
}

// Creates a new announcement with the given payload.
export async function createAnnouncement(payload) {
    const { data } = await api.post('/announcements', payload);
    return data?.data;
}

// Updates an existing announcement identified by its ID.
export async function updateAnnouncement(announcementId, payload) {
    const { data } = await api.put(`/announcements/${announcementId}`, payload);
    return data?.data;
}

// Deletes an announcement permanently by its ID.
export async function deleteAnnouncement(announcementId) {
    await api.delete(`/announcements/${announcementId}`);
}
