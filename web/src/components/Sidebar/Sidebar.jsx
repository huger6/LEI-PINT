import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import SidebarOption from './SidebarOption/SidebarOption';
import Icon from '../Icons/Icons';

export default function Sidebar() {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { to: '/', icon: 'home', label: 'sidebar.home' },
        { to: '/badges', icon: 'badge', label: 'sidebar.badges' },
        { to: '/applications', icon: 'paper', label: 'sidebar.applications' },
        { to: '/achievements', icon: 'trophy', label: 'sidebar.achievements' },
        { to: '/points', icon: 'star-points', label: 'sidebar.points', news: true },
        { to: '/objectives', icon: 'target', label: 'sidebar.objectives' },
        { to: '/evolution', icon: 'evolution', label: 'sidebar.evolution' },
        { to: '/announcements', icon: 'megaphone', label: 'sidebar.announcements', news: true },
    ];

    const bottomItems = [
        { to: '/settings', icon: 'settings', label: 'sidebar.settings' },
        { to: '/logout', icon: 'exit-door', label: 'sidebar.logout' },
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
                                news={item.news}
                                collapsed={collapsed}
                            />
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.bottomSection}>
                {bottomItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={styles.navLink}>
                        {({ isActive }) => (
                            <SidebarOption
                                as="div"
                                icon={item.icon}
                                label={item.label}
                                active={isActive}
                                collapsed={collapsed}
                            />
                        )}
                    </NavLink>
                ))}
            </div>
        </aside>
    );
}
