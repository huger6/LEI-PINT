// Base layout shell with sidebar, top bar, main content area, and footer.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';
import TopBar from '../../components/TopBar/TopBar';

/**
 * Shared app shell used by all role-specific layouts.
 * @param {Array} menuItems - Sidebar navigation items for the current role.
 */
export default function AppLayout({ menuItems }) {
    // Tracks whether the mobile sidebar is currently open.
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidebar
                menuItems={menuItems}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />
            <div className={styles.contentArea}>
                <TopBar onMenuToggle={() => setMobileOpen(prev => !prev)} />
                <div className={styles.scrollArea}>
                    <main className={styles.mainContent}>
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
