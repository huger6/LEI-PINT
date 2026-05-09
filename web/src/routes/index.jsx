import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import {
	authPublicRoutes,
	authOpenRoutes,
	authFpcRoutes,
} from '../features/auth/routes';
import RoleLayout from '../layouts/RoleLayout/RoleLayout';
import Dashboard from '../pages/Dashboard/Dashboard';

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
				</Route>
			</Route>

			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	);
}
