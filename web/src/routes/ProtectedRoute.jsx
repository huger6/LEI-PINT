import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { LoadingScreen } from '../components/LoadingScreen/LoadingScreen';

export default function ProtectedRoute({ requireFpc = false }) {
    const { isAuthenticated, fpc, isLoading } = useAuth();

    if (isLoading) return <LoadingScreen />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (requireFpc && !fpc) return <Navigate to="/" replace />;
    if (!requireFpc && fpc) return <Navigate to="/change-password" replace />;

    return <Outlet />;
}
