import api from '../../../services/api';

export async function getAcquisitionTimeline() {
    const { data } = await api.get('/statistics/consultant/timeline');
    return data?.data || [];
}

export async function getBadgesPerArea() {
    const { data } = await api.get('/statistics/consultant/badges-per-area');
    return data?.data || [];
}

export async function getApplicationsWithPagination(params = {}) {
    const { data } = await api.get('/applications', { params });
    return {
        applications: data?.data || [],
        pagination: data?.pagination || { total: 0 },
    };
}
