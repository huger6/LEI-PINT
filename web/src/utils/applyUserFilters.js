const toBool = (v) => v === true || v === 'true';

const parseDate = (ddMmYyyy) => {
	if (!ddMmYyyy) return null;
	const [dd, mm, yyyy] = ddMmYyyy.split('-');
	return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
};

const applyUserFilters = (users, filters = {}) => {
	const {
		search,
		role,
		isActive,
		emailConfirmed,
		gdprAccepted,
		serviceLine,
		area,
		dateFrom,
		pointsMin,
		pointsMax,
	} = filters;

	const fromDate = parseDate(dateFrom);

	return users.filter((user) => {
		if (search) {
			const q = search.toLowerCase();
			const nameMatch = user.full_name?.toLowerCase().includes(q);
			const emailMatch = user.email_address?.toLowerCase().includes(q);
			if (!nameMatch && !emailMatch) return false;
		}

		if (role !== undefined && role !== '') {
			if (user.user_role !== role) return false;
		}

		if (isActive !== undefined) {
			if (user.is_active !== toBool(isActive)) return false;
		}

		if (emailConfirmed !== undefined) {
			if (user.email_confirmed !== toBool(emailConfirmed)) return false;
		}

		if (gdprAccepted !== undefined) {
			if (user.consultant?.gdpr_accepted !== toBool(gdprAccepted)) return false;
		}

		if (serviceLine !== undefined && serviceLine !== '') {
			if (user.service_line_leader?.service_line_id !== Number(serviceLine)) return false;
		}

		if (area !== undefined && area !== '') {
			const hasArea = user.consultant?.consultant_areas?.some(
				(ca) => ca.area_id === Number(area)
			);
			if (!hasArea) return false;
		}

		if (fromDate && new Date(user.created_at) < fromDate) return false;

		if (pointsMin !== undefined && (user.total_points ?? 0) < Number(pointsMin)) return false;
		if (pointsMax !== undefined && (user.total_points ?? 0) > Number(pointsMax)) return false;

		return true;
	});
};

export default applyUserFilters;
