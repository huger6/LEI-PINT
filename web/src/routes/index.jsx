import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import {
	authPublicRoutes,
	authOpenRoutes,
	authFpcRoutes,
} from '../features/auth/routes';
import RoleLayout from '../layouts/RoleLayout/RoleLayout';
import Dashboard from '../pages/Dashboard/Dashboard';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers/AdminUsers';
import AdminBadges from '../pages/admin/AdminBadges/AdminBadges';
import AdminAreas from '../pages/admin/AdminAreas/AdminAreas';
import AdminServiceLines from '../pages/admin/AdminServiceLines/AdminServiceLines';
import AdminLearningPaths from '../pages/admin/AdminLearningPaths/AdminLearningPaths';
import AdminLevels from '../pages/admin/AdminLevels/AdminLevels';
import AdminRequirements from '../pages/admin/AdminRequirements/AdminRequirements';
import AdminStructure from '../pages/admin/AdminStructure/AdminStructure';

// Consultant pages
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';
import BadgeDetail from '../pages/consultant/BadgeDetail/BadgeDetail';
import ApplicationDetail from '../pages/consultant/ApplicationDetail/ApplicationDetail';

// Shared role-based pages
import ApplicationsPage from '../pages/ApplicationsPage/ApplicationsPage';
import ErrorCodePage from '../pages/shared/ErrorCodePage/ErrorCodePage';

export default function AppRoutes() {
	return (
		<Routes>
			<Route element={<PublicRoute />}>
				{authPublicRoutes.map(({ path, element }) => (
					<Route key={path} path={path} element={element} />
				))}
			</Route>

			{authOpenRoutes.map(({ path, element }) => (
				<Route key={path} path={path} element={element} />
			))}

			<Route element={<ProtectedRoute requireFpc />}>
				{authFpcRoutes.map(({ path, element }) => (
					<Route key={path} path={path} element={element} />
				))}
			</Route>

			<Route element={<ProtectedRoute />}>
				<Route element={<RoleLayout />}>
					<Route path="/" element={<Dashboard />} />

					{/* Admin */}
					<Route path="/dashboard" element={<AdminDashboard />} />
					<Route path="/structure" element={<AdminStructure />} />
					<Route path="/users" element={<AdminUsers />} />
					<Route path="/badges" element={<AdminBadges />} />
					<Route path="/areas" element={<AdminAreas />} />
					<Route path="/service-lines" element={<AdminServiceLines />} />
					<Route path="/learning-paths" element={<AdminLearningPaths />} />
					<Route path="/levels" element={<AdminLevels />} />
					<Route path="/requirements" element={<AdminRequirements />} />

					{/* Consultant */}
					<Route path="/catalog" element={<BadgeCatalog />} />
					<Route path="/badges/:slug" element={<BadgeDetail />} />
					<Route path="/applications/:id" element={<ApplicationDetail />} />

					{/* Shared / role-based */}
					<Route path="/applications" element={<ApplicationsPage />} />
				</Route>
			</Route>

			<Route path="*" element={<ErrorCodePage code={404} />} />
		</Routes>
	);
}
