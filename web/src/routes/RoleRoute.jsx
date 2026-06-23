// Route guard that restricts access based on the user's role. Shows 403 if unauthorized.
import { Outlet } from 'react-router-dom';
import { useUser } from '../hooks/userContext';
import ErrorCodePage from '../pages/shared/ErrorCodePage/ErrorCodePage';

/**
 * Checks the user's role against the allowed list and renders 403 if unauthorized.
 * @param {string[]} allowedRoles - Roles permitted to access the child routes.
 */
export default function RoleRoute({ allowedRoles }) {
	const { user, isUserLoading } = useUser();

	if (isUserLoading) return <Outlet />;

	if (allowedRoles && !allowedRoles.includes(user?.role)) {
		return <ErrorCodePage code={403} />;
	}

	return <Outlet />;
}
