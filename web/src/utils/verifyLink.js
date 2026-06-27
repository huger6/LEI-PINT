// Helpers for building public badge-verification links.
//
// The stored verification value (`public_verification_link`) is a bare token
// (a GUID) for badges awarded by the API, but some seed/legacy rows hold a full
// URL such as `https://badges.softinsa.pt/verify/<token>`. To build a link that
// always points at the CURRENT deployment's `/verify/:link` route, we extract
// just the token and prepend our own origin/route — never the stored URL.

// Extract the bare token (last path segment) from a stored verification value.
export function verifyToken(link) {
	if (!link) return '';
	return String(link).split(/[/\\]/).filter(Boolean).pop() || '';
}

// In-app relative path to the verification page (e.g. "/verify/<token>").
export function verifyPath(link) {
	const token = verifyToken(link);
	return token ? `/verify/${token}` : '';
}

// Absolute verification URL on the current origin (for sharing/copying).
export function verifyUrl(link) {
	const path = verifyPath(link);
	return path ? `${window.location.origin}${path}` : '';
}
