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
import sharedRoutes from './sharedRoutes';

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

					<Route element={<RoleRoute allowedRoles={['Administrator']} />}>
						{adminRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>

					<Route element={<RoleRoute allowedRoles={['Consultant']} />}>
						{consultantRoutes.map(({ path, element }) => (
							<Route key={path} path={path} element={element} />
						))}
					</Route>

					{sharedRoutes.map(({ path, element }) => (
						<Route key={path} path={path} element={element} />
					))}
				</Route>
			</Route>

			<Route path="*" element={<ErrorCodePage code={404} />} />
		</Routes>
	);
}
