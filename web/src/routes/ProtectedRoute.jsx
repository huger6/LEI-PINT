import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { useUser } from '../hooks/userContext';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';

export default function ProtectedRoute({ requireFpc = false, allowedRoles }) {
    const { isAuthenticated, fpc, isLoading } = useAuth();
    const { user, isUserLoading } = useUser();

    if (isLoading || (!requireFpc && isUserLoading)) return <LoadingScreen />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (requireFpc && !fpc) return <Navigate to="/" replace />;
    if (!requireFpc && fpc) return <Navigate to="/change-password" replace />;

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}
