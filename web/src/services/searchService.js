// Global search across badges, users, and structure entities.
import api from './api';

// Runs a global search query, returning up to `limit` matches.
export async function globalSearch(query, { limit = 50 } = {}) {
    const { data } = await api.get('/search', {
        params: { q: query, limit }
    });
    return data;
}
