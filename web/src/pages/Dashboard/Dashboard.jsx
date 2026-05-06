import AppLayout from "../../layouts/AppLayout/AppLayout";
import styles from '../../assets/styles/componentes/App.module.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks/useAuth';
import SidebarOption from "../../components/Sidebar/SidebarOption/SidebarOption";

export default function Dashboard() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <AppLayout>

        </AppLayout>
    );
}