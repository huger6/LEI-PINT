import { ADMIN } from './paths';
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers/AdminUsers';
import AdminBadges from '../pages/admin/AdminBadges/AdminBadges';
import AdminBadgeForm from '../pages/admin/AdminBadgeForm/AdminBadgeForm';
import AdminStructure from '../pages/admin/AdminStructure/AdminStructure';
import UserProfile from '../pages/shared/UserProfile/UserProfile';
import {
	LearningPathDetail,
	ServiceLineDetail,
	AreaDetail,
	LevelDetail,
	LearningPathsList,
	ServiceLinesList,
	AreasList,
	LevelsList,
} from '../features/structure';
import Announcements from '../pages/management/Announcements/Announcements';
import ValidationsBoard from '../pages/management/ValidationsBoard/ValidationsBoard';
import StatsPage from '../pages/management/StatsPage/StatsPage';
import AdminNotifications from '../pages/admin/AdminNotifications/AdminNotifications';
import AdminRgpd from '../pages/admin/AdminRgpd/AdminRgpd';
import AdminSlas from '../pages/admin/AdminSlas/AdminSlas';
import AdminIntegrations from '../pages/admin/AdminIntegrations/AdminIntegrations';

// Administrator-only routes: dashboard, structure, users, badges, and management pages.
const adminRoutes = [
	{ path: ADMIN.DASHBOARD, element: <AdminDashboard /> },
	{ path: ADMIN.STRUCTURE, element: <AdminStructure /> },
	{ path: ADMIN.USERS, element: <AdminUsers /> },
	{ path: ADMIN.USER_PROFILE, element: <UserProfile /> },
	{ path: ADMIN.BADGES, element: <AdminBadges /> },
	{ path: ADMIN.BADGE_NEW, element: <AdminBadgeForm /> },
	{ path: ADMIN.BADGE_EDIT, element: <AdminBadgeForm /> },
	{ path: ADMIN.AREAS, element: <AreasList /> },
	{ path: ADMIN.SERVICE_LINES, element: <ServiceLinesList /> },
	{ path: ADMIN.LEARNING_PATHS, element: <LearningPathsList /> },
	{ path: ADMIN.LEVELS, element: <LevelsList /> },
	{ path: ADMIN.APPLICATIONS, element: <ValidationsBoard /> },
	{ path: ADMIN.NOTIFICATIONS, element: <AdminNotifications /> },
	{ path: ADMIN.RGPD, element: <AdminRgpd /> },
	{ path: ADMIN.SLAS, element: <AdminSlas /> },
	{ path: ADMIN.INTEGRATIONS, element: <AdminIntegrations /> },
	{ path: ADMIN.STATS, element: <StatsPage /> },
	{ path: ADMIN.LEARNING_PATH_DETAIL, element: <LearningPathDetail /> },
	{ path: ADMIN.SERVICE_LINE_DETAIL, element: <ServiceLineDetail /> },
	{ path: ADMIN.AREA_DETAIL, element: <AreaDetail /> },
	{ path: ADMIN.LEVEL_DETAIL, element: <LevelDetail /> },
	{ path: ADMIN.ANNOUNCEMENTS, element: <Announcements /> },
];

export default adminRoutes;
