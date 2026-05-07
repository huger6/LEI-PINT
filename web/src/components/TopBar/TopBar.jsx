import styles from './TopBar.module.css';
import NotificationIcon from '../NotificationIcon/NotificationIcon';
import Logo from '../Logo/Logo';

export default function TopBar({ role = "Consultant" }) {
    return (
        <div className={styles.topBar}>
            <Logo />
            <div className={styles.rightSection}>
                <NotificationIcon count={3} />
                <div className={styles.userInfo}>
                    <span className={styles.role}>{role}</span>
                </div>
            </div>
        </div>
    );
}