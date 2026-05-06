import styles from './AppLayout.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import Footer from '../../components/Footer/Footer';

export default function AppLayout({ children }) {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.contentArea}>
                <main className={styles.mainContent}>
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
