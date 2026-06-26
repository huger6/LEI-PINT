// API for user management operations used by admin and management roles.
import api from '../../../services/api';

// Fetches a paginated and filtered user list for admin management screens.
export const fetchUsers = async ({ filters = {}, page = 1, limit = 32 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    const filterKeys = [
        'search', 'role', 'isActive', 'emailConfirmed', 'gdprAccepted',
        'serviceLine', 'area', 'dateFrom', 'pointsMin', 'pointsMax',
    ];

    for (const key of filterKeys) {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
        }
    }

    const { data } = await api.get('/admin/users', { params });
    return data;
};

// Creates a new user account via the admin API.
export const createUser = async (payload) => {
    const { data } = await api.post('/admin/users', payload);
    return data?.data;
};

// Updates a user's profile fields via the admin API.
export const updateUser = async (userGuid, payload) => {
    const { data } = await api.put(`/admin/users/${userGuid}`, payload);
    return data?.data;
};

// Soft-deletes (deactivates) a user account by their GUID.
export const deactivateUser = async (userGuid) => {
    await api.delete(`/admin/users/${userGuid}`);
};

// Reactivates a previously deactivated user account.
export const reactivateUser = async (userGuid) => {
    await api.patch(`/admin/users/${userGuid}/activate`);
};
