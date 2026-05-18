import api from '../../../services/api';

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

export const createUser = async (payload) => {
    const { data } = await api.post('/admin/users', payload);
    return data?.data;
};

export const updateUser = async (userGuid, payload) => {
    const { data } = await api.put(`/admin/users/${userGuid}`, payload);
    return data?.data;
};

export const deactivateUser = async (userGuid) => {
    await api.delete(`/admin/users/${userGuid}`);
};
