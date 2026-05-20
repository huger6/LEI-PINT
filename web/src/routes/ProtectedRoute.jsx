import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import { AUTH, SHARED } from './paths';

export default function ProtectedRoute({ requireFpc = false }) {
    const { isAuthenticated, fpc, isLoading } = useAuth();

    if (isLoading) {
        // If a stored session exists, render the layout shell optimistically
        // so RoleLayout can show the sidebar + skeleton instead of a blank spinner.
        // For force-password-change routes, keep the spinner since they don't use RoleLayout.
        if (!requireFpc && localStorage.getItem('hasSession')) return <Outlet />;
        return <LoadingScreen />;
    }

    if (!isAuthenticated) return <Navigate to={AUTH.LOGIN} replace />;
    if (requireFpc && !fpc) return <Navigate to={SHARED.HOME} replace />;
    if (!requireFpc && fpc) return <Navigate to={AUTH.CHANGE_PASSWORD} replace />;

    return <Outlet />;
}
