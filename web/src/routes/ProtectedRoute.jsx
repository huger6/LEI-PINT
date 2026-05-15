import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { useUser } from '../hooks/userContext';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import { AUTH, SHARED } from './paths';

export default function ProtectedRoute({ requireFpc = false }) {
    const { isAuthenticated, fpc, isLoading } = useAuth();
    const { isUserLoading } = useUser();

    if (isLoading || (!requireFpc && isUserLoading)) return <LoadingScreen />;
    if (!isAuthenticated) return <Navigate to={AUTH.LOGIN} replace />;
    if (requireFpc && !fpc) return <Navigate to={SHARED.HOME} replace />;
    if (!requireFpc && fpc) return <Navigate to={AUTH.CHANGE_PASSWORD} replace />;

    return <Outlet />;
}
