import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { LoadingScreen } from '../components/LoadingScreen/LoadingScreen';

export default function PublicRoute() {
	const { isAuthenticated, fpc, isLoading } = useAuth();

	if (isLoading) return <LoadingScreen />;
	if (isAuthenticated && fpc) return <Navigate to="/change-password" replace />;
	if (isAuthenticated) return <Navigate to="/" replace />;

	return <Outlet />;
}
