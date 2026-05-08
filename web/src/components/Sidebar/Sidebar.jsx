import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import styles from './Sidebar.module.css';
import SidebarOption from './SidebarOption/SidebarOption';
import Icon from '../Icons/Icons';

export default function Sidebar() {
    const { t } = useTranslation();
    const { notifications } = useUser();
    const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 991px)').matches);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991px)');
        const handler = (e) => { if (e.matches) setCollapsed(true); };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

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
                                news={Boolean(item.notificationType && notifications?.unreadByType?.[item.notificationType] > 0)}
                                collapsed={collapsed}
                            />
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
