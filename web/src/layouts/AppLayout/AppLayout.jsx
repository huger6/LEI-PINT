import { Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';
import TopBar from '../../components/TopBar/TopBar';

export default function AppLayout({ menuItems }) {
    return (
        <div className={styles.layout}>
            <Sidebar menuItems={menuItems} />
            <div className={styles.contentArea}>
                <TopBar />
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
}
