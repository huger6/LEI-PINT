import AppLayout from "../../layouts/AppLayout/AppLayout";
import styles from '../../assets/styles/componentes/App.module.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUser } from '../../hooks/userContext';
import WelcomeCard from "../../components/WelcomeCard/WelcomeCard";

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
            <WelcomeCard>

            </WelcomeCard>
        </AppLayout>
    );
}