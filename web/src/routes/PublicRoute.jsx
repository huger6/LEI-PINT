// Route guard for unauthenticated pages (login, register). Redirects to home if already logged in.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import { AUTH, SHARED } from './paths';

export default function PublicRoute() {
	const { isAuthenticated, fpc, isLoading } = useAuth();

	if (isLoading) return <LoadingScreen />;
	if (isAuthenticated && fpc) return <Navigate to={AUTH.CHANGE_PASSWORD} replace />;
	if (isAuthenticated) return <Navigate to={SHARED.HOME} replace />;

	return <Outlet />;
}
