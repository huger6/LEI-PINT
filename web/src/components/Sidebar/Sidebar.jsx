import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUser } from '../../hooks/userContext';
import styles from './Sidebar.module.css';
import SidebarOption from './SidebarOption/SidebarOption';
import ConfirmToast from '../ConfirmToast/ConfirmToast';
import Icon from '../Icons/Icons';
import Avatar from '../Avatar/Avatar';

export default function Sidebar() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { user, displayName, unreadByType, isUserLoading } = useUser();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const displayRole = user?.role || '';

    const menuItems = [
        { to: '/', icon: 'home', label: 'sidebar.home', notificationType: 'HOME' },
        { to: '/badges', icon: 'badge', label: 'sidebar.badges', notificationType: 'BADGES' },
        { to: '/applications', icon: 'paper', label: 'sidebar.applications', notificationType: 'APPLICATIONS' },
        { to: '/achievements', icon: 'trophy', label: 'sidebar.achievements', notificationType: 'ACHIEVEMENTS' },
        { to: '/points', icon: 'star-points', label: 'sidebar.points', notificationType: 'POINTS' },
        { to: '/objectives', icon: 'target', label: 'sidebar.objectives', notificationType: 'OBJECTIVES' },
        { to: '/evolution', icon: 'evolution', label: 'sidebar.evolution', notificationType: 'EVOLUTION' },
        { to: '/announcements', icon: 'megaphone', label: 'sidebar.announcements', notificationType: 'ANNOUNCEMENTS' },
    ];

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate('/login');
    };

    return (
        <aside className={`${styles.sidebarShell} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                <button
                    className={styles.toggleButton}
                    onClick={() => setCollapsed(prev => !prev)}
                    aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
                >
                    <Icon
                        name="hamburger"
                        size={24}
                        color="var(--color-on-background)"
                        className={`${styles.toggleIcon} ${collapsed ? styles.toggleIconCollapsed : ''}`}
                    />
                </button>
                <span className={styles.headerTitle}>{t('sidebar.menu')}</span>
            </div>

            <nav className={styles.nav} aria-label={t('sidebar.menu')}>
                {menuItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={styles.navLink}>
                        {({ isActive }) => (
                            <SidebarOption
                                as="div"
                                icon={item.icon}
                                label={item.label}
                                active={isActive}
                                news={Boolean(item.notificationType && unreadByType?.[item.notificationType] > 0)}
                                collapsed={collapsed}
                            />
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.bottomSection}>
                <NavLink to="/settings" className={styles.navLink}>
                    {({ isActive }) => (
                        <SidebarOption
                            as="div"
                            icon="settings"
                            label="sidebar.settings"
                            active={isActive}
                            collapsed={collapsed}
                        />
                    )}
                </NavLink>
                <SidebarOption
                    icon="exit-door"
                    label="sidebar.logout"
                    collapsed={collapsed}
                    onClick={() => setShowLogoutConfirm(true)}
                />
            </div>

            <ConfirmToast
                open={showLogoutConfirm}
                message={t('confirmToast.logoutMessage')}
                confirmLabel={t('confirmToast.yes')}
                cancelLabel={t('confirmToast.no')}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </aside>
    );
}
