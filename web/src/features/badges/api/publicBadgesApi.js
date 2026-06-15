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

// Verifies an earned credential by its unique public link (no auth).
// Returns the verification payload, or null if not found / not published.
export async function verifyBadge(link) {
	const { data } = await api.get(`/public/verify/${encodeURIComponent(link)}`);
	return data?.data || null;
}
