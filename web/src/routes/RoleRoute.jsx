import { Outlet } from 'react-router-dom';
import { useUser } from '../hooks/userContext';
import ErrorCodePage from '../pages/shared/ErrorCodePage/ErrorCodePage';

export default function RoleRoute({ allowedRoles }) {
	const { user } = useUser();

	if (allowedRoles && !allowedRoles.includes(user?.role)) {
		return <ErrorCodePage code={403} />;
	}

	return <Outlet />;
}
