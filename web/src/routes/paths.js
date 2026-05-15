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
	BADGES: '/admin/badges',
	AREAS: '/admin/areas',
	SERVICE_LINES: '/admin/service-lines',
	LEARNING_PATHS: '/admin/learning-paths',
	LEVELS: '/admin/levels',
	REQUIREMENTS: '/admin/requirements',
	APPLICATIONS: '/admin/applications',
	SLAS: '/admin/slas',
	WARNINGS: '/admin/warnings',
	NOTIFICATIONS: '/admin/notifications',
	STATS: '/admin/stats',
	RGPD: '/admin/rgpd',
};

export const CONSULTANT = {
	HOME: '/',
	CATALOG: '/catalog',
	APPLICATIONS: '/applications',
	ACHIEVEMENTS: '/achievements',
	POINTS: '/points',
	OBJECTIVES: '/objectives',
	EVOLUTION: '/evolution',
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
	BADGES: '/badges',
	APPLICATIONS: '/applications',
	BADGE_DETAIL: '/badges/:slug',
	APPLICATION_DETAIL: '/applications/:id',
	PROFILE: '/profile',
	MAIL_SIGNATURE: '/mail-signature',
	PUBLIC_PROFILE: '/public-profile',
	SETTINGS: '/settings',
	PRIVACY: '/privacy',
	SECURITY: '/security',
	UNAUTHORIZED: '/unauthorized',
};
