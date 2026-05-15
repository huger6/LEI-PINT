import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers/AdminUsers';
import AdminBadges from '../pages/admin/AdminBadges/AdminBadges';
import AdminAreas from '../pages/admin/AdminAreas/AdminAreas';
import AdminServiceLines from '../pages/admin/AdminServiceLines/AdminServiceLines';
import AdminLearningPaths from '../pages/admin/AdminLearningPaths/AdminLearningPaths';
import AdminLevels from '../pages/admin/AdminLevels/AdminLevels';
import AdminRequirements from '../pages/admin/AdminRequirements/AdminRequirements';
import AdminStructure from '../pages/admin/AdminStructure/AdminStructure';

const adminRoutes = [
	{ path: '/dashboard', element: <AdminDashboard /> },
	{ path: '/structure', element: <AdminStructure /> },
	{ path: '/users', element: <AdminUsers /> },
	{ path: '/badges', element: <AdminBadges /> },
	{ path: '/areas', element: <AdminAreas /> },
	{ path: '/service-lines', element: <AdminServiceLines /> },
	{ path: '/learning-paths', element: <AdminLearningPaths /> },
	{ path: '/levels', element: <AdminLevels /> },
	{ path: '/requirements', element: <AdminRequirements /> },
];

export default adminRoutes;
