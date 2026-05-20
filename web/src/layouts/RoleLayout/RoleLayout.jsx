import { Outlet } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import ErrorCodePage from '../../pages/shared/ErrorCodePage/ErrorCodePage';
import Sidebar from '../../components/Sidebar/Sidebar';
import TopBar from '../../components/TopBar/TopBar';
import Footer from '../../components/Footer/Footer';
import DashboardSkeleton from '../../components/Skeleton/DashboardSkeleton';
import ConsultantLayout from '../ConsultantLayout/ConsultantLayout';
import TmLayout from '../TmLayout/TmLayout';
import SllLayout from '../SllLayout/SllLayout';
import AdminLayout from '../AdminLayout/AdminLayout';
import appStyles from '../AppLayout/AppLayout.module.css';

const LAYOUT_BY_ROLE = {
    'Consultant': ConsultantLayout,
    'Talent Manager': TmLayout,
    'Service Line Leader': SllLayout,
    'Administrator': AdminLayout,
};

export default function RoleLayout() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className={appStyles.layout}>
                <Sidebar menuItems={[]} />
                <div className={appStyles.contentArea}>
                    <TopBar />
                    <main className={appStyles.mainContent}>
                        <DashboardSkeleton />
                    </main>
                    <Footer />
                </div>
            </div>
        );
    }

    const Layout = LAYOUT_BY_ROLE[user?.role];

    if (!Layout) return <ErrorCodePage code={403} />;

    return <Layout />;
}
