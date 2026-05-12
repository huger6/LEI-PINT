/**
 * applyUserFilters — pure function that filters a user list client-side.
 *
 * Exported separately from the UI so the same logic can power both the
 * live table view and the Excel / PDF export feature without duplication.
 *
 * @param {Object[]} users   Full list of user objects from the API.
 * @param {Object}   filters Current filter state (see EMPTY_FILTERS in UserFilters.jsx).
 * @returns {Object[]}       Subset of users that match every active filter.
 */
export default function applyUserFilters(users, filters) {
	return users.filter((u) => {
		// ── Global search: matches full_name OR email_address ──────────────────
		if (filters.search) {
			const q = filters.search.toLowerCase();
			const name = (u.full_name || u.fullName || '').toLowerCase();
			const email = (u.email_address || u.emailAddress || '').toLowerCase();
			if (!name.includes(q) && !email.includes(q)) return false;
		}

		// ── Role (exact match against user_role) ───────────────────────────────
		if (filters.role && (u.user_role || u.userRole) !== filters.role) return false;

		// ── Active status (is_active boolean) ─────────────────────────────────
		if (filters.isActive !== '') {
			const expected = filters.isActive === 'true';
			if (Boolean(u.is_active ?? u.isActive) !== expected) return false;
		}

		// ── Email confirmation status ──────────────────────────────────────────
		if (filters.emailConfirmed !== '') {
			const expected = filters.emailConfirmed === 'true';
			if (Boolean(u.email_confirmed ?? u.emailConfirmed) !== expected) return false;
		}

		// ── GDPR accepted (public-profile sharing consent) ────────────────────
		if (filters.gdprAccepted !== '') {
			const expected = filters.gdprAccepted === 'true';
			if (Boolean(u.gdpr_accepted ?? u.gdprAccepted) !== expected) return false;
		}

		// ── Service Line (organisational hierarchy) ───────────────────────────
		if (filters.serviceLine) {
			const id = String(u.service_line_id || u.serviceLineId || '');
			if (id !== String(filters.serviceLine)) return false;
		}

		// ── Area (narrowed from the selected service line) ────────────────────
		if (filters.area) {
			const id = String(u.area_id || u.areaId || '');
			if (id !== String(filters.area)) return false;
		}

		// ── Registration date — from (inclusive) ──────────────────────────────
		if (filters.dateFrom) {
			const createdAt = new Date(u.created_at || u.createdAt || 0);
			const from = new Date(filters.dateFrom);
			if (createdAt < from) return false;
		}

		// ── Registration date — to (inclusive of the full selected day) ───────
		if (filters.dateTo) {
			const createdAt = new Date(u.created_at || u.createdAt || 0);
			const to = new Date(filters.dateTo);
			to.setHours(23, 59, 59, 999);
			if (createdAt > to) return false;
		}

		// ── Points range (total gamification points) ──────────────────────────
		if (filters.pointsMin !== '') {
			const pts = Number(u.total_points || u.totalPoints || 0);
			if (pts < Number(filters.pointsMin)) return false;
		}
		if (filters.pointsMax !== '') {
			const pts = Number(u.total_points || u.totalPoints || 0);
			if (pts > Number(filters.pointsMax)) return false;
		}

		return true;
	});
}
