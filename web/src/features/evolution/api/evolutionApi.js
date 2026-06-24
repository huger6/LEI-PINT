// API for the consultant evolution/progress tracking dashboard.
import api from '../../../services/api';

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

export async function getEarnedBadgesForEvolution() {
    const badges = [];
    let page = 1;
    const limit = 50;
    let totalPages = 1;

    while (page <= totalPages) {
        const { data } = await api.get('/gamification/earned-badges', {
            params: { page, limit },
        });
        badges.push(...(data?.data || []));
        totalPages = data?.pagination?.totalPages || 1;
        page++;
    }

    return badges;
}
