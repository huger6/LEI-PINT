import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../hooks/userContext';
import styles from './Sidebar.module.css';
import SidebarOption from './SidebarOption/SidebarOption';
import Icon from '../Icons/Icons';

export default function Sidebar({ menuItems, mobileOpen = false, onMobileClose }) {
    const { t } = useTranslation();
    const { notifications } = useUser();
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 991px)').matches);
    // Desktop-only icon-rail collapse. On mobile we use an off-canvas drawer with full labels instead.
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991px)');
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const railCollapsed = !isMobile && collapsed;

    function handleHeaderToggle() {
        if (isMobile) onMobileClose?.();
        else setCollapsed(prev => !prev);
    }

    return (
        <>
            {isMobile && (
                <div
                    className={`${styles.backdrop} ${mobileOpen ? styles.backdropOpen : ''}`}
                    onClick={onMobileClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={[
                    styles.sidebarShell,
                    railCollapsed ? styles.collapsed : '',
                    isMobile ? styles.mobile : '',
                    isMobile && mobileOpen ? styles.mobileOpen : '',
                ].join(' ')}
            >
                <div className={styles.header}>
                    <button
                        className={styles.toggleButton}
                        onClick={handleHeaderToggle}
                        aria-label={isMobile ? t('sidebar.collapse') : (collapsed ? t('sidebar.expand') : t('sidebar.collapse'))}
                    >
                        <Icon
                            name={isMobile ? 'close' : 'sidebar-close'}
                            size={24}
                            color="var(--color-on-background)"
                            className={`${styles.toggleIcon} ${railCollapsed ? styles.toggleIconCollapsed : ''}`}
                        />
                    </button>
                    <span className={styles.headerTitle}>{t('sidebar.menu')}</span>
                </div>

                <nav className={styles.nav} aria-label={t('sidebar.menu')}>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={styles.navLink}
                            onClick={() => { if (isMobile) onMobileClose?.(); }}
                        >
                            {({ isActive }) => (
                                <SidebarOption
                                    as="div"
                                    icon={item.icon}
                                    label={item.label}
                                    active={isActive}
                                    news={Boolean(item.notificationType && notifications?.unreadByType?.[item.notificationType] > 0)}
                                    collapsed={railCollapsed}
                                />
                            )}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
