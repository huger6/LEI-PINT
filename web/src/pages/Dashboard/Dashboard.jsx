import { Navigate } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import { SHARED } from '../../routes/paths';
import ConsultantDashboard from '../consultant/ConsultantDashboard/ConsultantDashboard';
import AdminDashboard from '../admin/AdminDashboard/AdminDashboard';
import TmDashboard from '../management/TmDashboard/TmDashboard';
import SllDashboard from '../management/SllDashboard/SllDashboard';

const DASHBOARDS = {
    'Consultant': ConsultantDashboard,
    'Administrator': AdminDashboard,
    'Talent Manager': TmDashboard,
    'Service Line Leader': SllDashboard,
};

// Role-based router: renders the dashboard matching the current user's role
export default function Dashboard() {
    // Get the authenticated user from context
    const { user } = useUser();
    const DashboardComponent = DASHBOARDS[user?.role];

    if (!DashboardComponent) return <Navigate to={SHARED.UNAUTHORIZED} replace />;

    return <DashboardComponent />;
}