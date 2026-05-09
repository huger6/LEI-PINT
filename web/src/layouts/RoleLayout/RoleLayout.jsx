import { Navigate } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import ConsultantLayout from '../ConsultantLayout/ConsultantLayout';
import TmLayout from '../TmLayout/TmLayout';
import SllLayout from '../SllLayout/SllLayout';
import AdminLayout from '../AdminLayout/AdminLayout';

const LAYOUT_BY_ROLE = {
    'Consultant': ConsultantLayout,
    'Talent Manager': TmLayout,
    'Service Line Leader': SllLayout,
    'Administrator': AdminLayout,
};

export default function RoleLayout() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) return <LoadingScreen />;

    const Layout = LAYOUT_BY_ROLE[user?.role];

    if (!Layout) return <Navigate to="/login" replace />;

    return <Layout />;
}
