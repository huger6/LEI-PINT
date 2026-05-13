import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export const fetchUsers = async ({ filters = {}, page = 1, limit = 20 } = {}) => {
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

    const response = await axios.get(`${API_URL}/api/admin/users`, { params });
    return response.data;
};
