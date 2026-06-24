// Centralized route path constants grouped by role (AUTH, ADMIN, CONSULTANT, SLL, TM, SHARED).
export const AUTH = {
	LOGIN: '/login',
	REGISTER: '/register',
	FORGOT_PASSWORD: '/forgot-password',
	RESET_PASSWORD: '/reset-password',
	RESET_PASSWORD_CONFIRM: '/reset-password/confirm',
	CONFIRM_EMAIL: '/confirm-email',
	RESEND_CONFIRMATION: '/resend-confirmation',
	CHANGE_PASSWORD: '/change-password',
};

export const ADMIN = {
	DASHBOARD: '/admin/dashboard',
	STRUCTURE: '/admin/structure',
	USERS: '/admin/users',
	USER_PROFILE: '/admin/users/:guid',
	BADGES: '/admin/badges',
	BADGE_NEW: '/admin/badges/new',
	BADGE_EDIT: '/admin/badges/:slug/edit',
	AREAS: '/admin/structure/areas',
	SERVICE_LINES: '/admin/structure/service-lines',
	LEARNING_PATHS: '/admin/structure/learning-paths',
	LEVELS: '/admin/structure/levels',
	REQUIREMENTS: '/admin/requirements',
	APPLICATIONS: '/admin/applications',
	SLAS: '/admin/slas',
	NOTIFICATIONS: '/admin/notifications',
	INTEGRATIONS: '/admin/integrations',
	STATS: '/admin/stats',
	RGPD: '/admin/rgpd',
	ANNOUNCEMENTS: '/admin/announcements',
	LEARNING_PATH_DETAIL: '/admin/structure/learning-paths/:slug',
	SERVICE_LINE_DETAIL: '/admin/structure/service-lines/:slug',
	AREA_DETAIL: '/admin/structure/areas/:slug',
	LEVEL_DETAIL: '/admin/structure/levels/:areaSlug/:stageCode',
};

export const CONSULTANT = {
	HOME: '/',
	CATALOG: '/catalog',
	APPLICATIONS: '/applications',
	ACHIEVEMENTS: '/achievements',
	POINTS: '/points',
	OBJECTIVES: '/objectives',
	EVOLUTION: '/evolution',
	RANKING: '/ranking',
	STORE: '/store',
	ANNOUNCEMENTS: '/announcements',
};

export const SLL = {
	DASHBOARD: '/',
	VALIDATIONS: '/validations',
	TEAM: '/team',
	BADGES: '/badges',
	BADGE_HISTORY: '/badge-history',
	STATS: '/stats',
	RANKING: '/ranking',
	ANNOUNCEMENTS: '/announcements',
};

export const TM = {
	DASHBOARD: '/',
	VALIDATIONS: '/validations',
	CONSULTANTS: '/consultants',
	BADGES: '/badges',
	STATS: '/stats',
	RANKING: '/ranking',
	ANNOUNCEMENTS: '/announcements',
};

export const SHARED = {
	HOME: '/',
	SEARCH: '/search',
	BADGES: '/badges',
	APPLICATIONS: '/applications',
	BADGE_DETAIL: '/badges/:slug',
	APPLICATION_DETAIL: '/applications/:id',
	APPLICATION_SUBMITTED: '/applications/:id/submitted',
	PROFILE: '/profile',
	PROFILE_EDIT: '/profile/edit',
	MAIL_SIGNATURE: '/mail-signature',
	PUBLIC_PROFILE: '/public-profile',
	USER_PROFILE_VIEW: '/u/:guid',
	SETTINGS: '/settings',
	PRIVACY: '/privacy',
	SECURITY: '/security',
	UNAUTHORIZED: '/unauthorized',
	RANKING: '/ranking',
	ANNOUNCEMENTS: '/announcements',
	// Read-only structure detail, available to every role (admin keeps its own
	// /admin/structure/* paths with management actions).
	STRUCTURE_LP_DETAIL: '/structure/learning-paths/:slug',
	STRUCTURE_SL_DETAIL: '/structure/service-lines/:slug',
	STRUCTURE_AREA_DETAIL: '/structure/areas/:slug',
	STRUCTURE_LEVEL_DETAIL: '/structure/levels/:areaSlug/:stageCode',
};

/** Returns structure detail path templates based on role (admin gets management routes, others get read-only). */
export function structureDetailPaths(isAdmin) {
	return isAdmin
		? { lp: ADMIN.LEARNING_PATH_DETAIL, sl: ADMIN.SERVICE_LINE_DETAIL, area: ADMIN.AREA_DETAIL, level: ADMIN.LEVEL_DETAIL }
		: { lp: SHARED.STRUCTURE_LP_DETAIL, sl: SHARED.STRUCTURE_SL_DETAIL, area: SHARED.STRUCTURE_AREA_DETAIL, level: SHARED.STRUCTURE_LEVEL_DETAIL };
}
