import { Navigate } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import ConsultantDashboard from './ConsultantDashboard';
import AdminDashboard from './AdminDashboard';
import TmDashboard from './TmDashboard';
import SllDashboard from './SllDashboard';

const DASHBOARDS = {
    'Consultant': ConsultantDashboard,
    'Administrator': AdminDashboard,
    'Talent Manager': TmDashboard,
    'Service Line Leader': SllDashboard,
};

export default function Dashboard() {
    const { user } = useUser();
    const DashboardComponent = DASHBOARDS[user?.role];

    if (!DashboardComponent) return <Navigate to="/unauthorized" replace />;

    return <DashboardComponent />;
}