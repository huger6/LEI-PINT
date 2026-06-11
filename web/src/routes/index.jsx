import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import RoleRoute from './RoleRoute';
import {
	authPublicRoutes,
	authOpenRoutes,
	authFpcRoutes,
} from '../features/auth/routes';
import RoleLayout from '../layouts/RoleLayout/RoleLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import ErrorCodePage from '../pages/shared/ErrorCodePage/ErrorCodePage';

import adminRoutes from './adminRoutes';
import consultantRoutes from './consultantRoutes';
import tmRoutes from './tmRoutes';
import sllRoutes from './sllRoutes';
import sharedRoutes from './sharedRoutes';
import { TM } from './paths';
import ValidationsBoard from '../pages/management/ValidationsBoard/ValidationsBoard';
import StatsPage from '../pages/management/StatsPage/StatsPage';
import Announcements from '../pages/management/Announcements/Announcements';
import BadgeCatalog from '../pages/consultant/BadgeCatalog/BadgeCatalog';

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
				<Route element={<RoleRoute allowedRoles={['Administrator']} />}>
					<Route element={<RoleLayout />}>
						{adminRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>
				</Route>

				<Route element={<RoleRoute allowedRoles={['Consultant']} />}>
					<Route element={<RoleLayout />}>
						{consultantRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>
				</Route>

				<Route element={<RoleRoute allowedRoles={['Talent Manager']} />}>
					<Route element={<RoleLayout />}>
						{tmRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>
				</Route>

				<Route element={<RoleRoute allowedRoles={['Service Line Leader']} />}>
					<Route element={<RoleLayout />}>
						{sllRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>
				</Route>

				{/* Shared management paths (Talent Manager + Service Line Leader).
				    Role-specific content is dispatched inside the elements. */}
				<Route element={<RoleRoute allowedRoles={['Talent Manager', 'Service Line Leader']} />}>
					<Route element={<RoleLayout />}>
						<Route path={TM.VALIDATIONS} element={<ValidationsBoard />} />
						<Route path={TM.STATS} element={<StatsPage />} />
						<Route path={TM.BADGES} element={<BadgeCatalog />} />
						<Route path={TM.ANNOUNCEMENTS} element={<Announcements />} />
					</Route>
				</Route>

				<Route element={<RoleLayout />}>
					<Route path="/" element={<Dashboard />} />
					{sharedRoutes.map(({ path, element }) => (
						<Route key={path} path={path} element={element} />
					))}
				</Route>
			</Route>

			<Route path="*" element={<ErrorCodePage code={404} />} />
		</Routes>
	);
}
