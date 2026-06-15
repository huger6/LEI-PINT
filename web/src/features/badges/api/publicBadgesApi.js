import api from '../../../services/api';

// Public badge catalog (no auth) used by the /softinsa microsite.
export async function getPublicBadges() {
	const { data } = await api.get('/public/badges');
	return data?.data || [];
}

export async function getPublicBadge(slug) {
	const { data } = await api.get(`/public/badges/${slug}`);
	return data?.data || null;
}
