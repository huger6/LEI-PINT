import { ADMIN } from './paths';
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers/AdminUsers';
import AdminBadges from '../pages/admin/AdminBadges/AdminBadges';
import AdminAreas from '../pages/admin/AdminAreas/AdminAreas';
import AdminServiceLines from '../pages/admin/AdminServiceLines/AdminServiceLines';
import AdminLearningPaths from '../pages/admin/AdminLearningPaths/AdminLearningPaths';
import AdminLevels from '../pages/admin/AdminLevels/AdminLevels';
import AdminRequirements from '../pages/admin/AdminRequirements/AdminRequirements';
import AdminStructure from '../pages/admin/AdminStructure/AdminStructure';
import UserProfile from '../pages/shared/UserProfile/UserProfile';

const adminRoutes = [
	{ path: ADMIN.DASHBOARD, element: <AdminDashboard /> },
	{ path: ADMIN.STRUCTURE, element: <AdminStructure /> },
	{ path: ADMIN.USERS, element: <AdminUsers /> },
	{ path: ADMIN.USER_PROFILE, element: <UserProfile /> },
	{ path: ADMIN.USER_PROFILE_EDIT, element: <UserProfile /> },
	{ path: ADMIN.BADGES, element: <AdminBadges /> },
	{ path: ADMIN.AREAS, element: <AdminAreas /> },
	{ path: ADMIN.SERVICE_LINES, element: <AdminServiceLines /> },
	{ path: ADMIN.LEARNING_PATHS, element: <AdminLearningPaths /> },
	{ path: ADMIN.LEVELS, element: <AdminLevels /> },
	{ path: ADMIN.REQUIREMENTS, element: <AdminRequirements /> },
];

export default adminRoutes;
