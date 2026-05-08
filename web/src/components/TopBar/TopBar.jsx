import styles from './TopBar.module.css';
import Logo from '../Logo/Logo';
import Avatar from '../Avatar/Avatar';
import { NotificationBell } from '../../features/notifications';
import { useUser } from '../../hooks/userContext';

export default function TopBar() {
    const { user, displayName } = useUser();

    return (
        <header className={styles.topBar}>
            <div className={styles.logoSection}>
                <Logo />
            </div>
            <div className={styles.rightSection}>
                <NotificationBell />
                <div className="d-flex align-items-center gap-2 gap-md-3">
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{displayName}</span>
                        {user?.role && <span className={styles.role}>{user.role}</span>}
                    </div>
                    <Avatar
                        src={user?.profileImg}
                        name={displayName}
                        size={36}
                        fallbackLabel={`${displayName} avatar`}
                    />
                </div>
            </div>
        </header>
    );
}
