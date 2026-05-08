import styles from './TopBar.module.css';
import Logo from '../Logo/Logo';
import { NotificationBell } from '../../features/notifications';
import { useUser } from '../../hooks/userContext';

export default function TopBar() {
    const { user } = useUser();

    return (
        <header className={styles.topBar}>
            <div className={styles.logoSection}>
                <Logo />
            </div>
            <div className={styles.rightSection}>
                <NotificationBell />
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{user?.full_name}</span>
                    <span className={styles.role}>{user?.user_role}</span>
                </div>
            </div>
        </header>
    );
}
