import api from './api';

export async function globalSearch(query, { limit = 50 } = {}) {
    const { data } = await api.get('/search', {
        params: { q: query, limit }
    });
    return data;
}
