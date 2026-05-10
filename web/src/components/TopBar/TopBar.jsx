import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './TopBar.module.css';
import Logo from '../Logo/Logo';
import { NotificationBell } from '../../features/notifications';
import { useUser } from '../../hooks/userContext';
import UserDropdown from './UserDropdown/UserDropdown';
import PointsCard from './PointsCard/PointsCard';
import SearchBar from './SearchBar/SearchBar';

export default function TopBar() {
    const { user, displayName, points } = useUser();
    const { t } = useTranslation();

    return (
        <header className={styles.topBar}>
            <Link to="/" className={styles.logoSection}>
                <Logo />
            </Link>
            <div className={styles.searchSection}>
                <SearchBar placeholder={t('topBar.searchPlaceholder')} />
            </div>
            <div className={styles.rightSection}>
                {
                    user.role === 'Consultant' && (
                        <div className={styles.pointsCardWrap}>
                            <PointsCard points={points ? points : 0} />
                        </div>
                    )
                }
                <NotificationBell />
                <div className="d-flex align-items-center gap-2 gap-md-3">
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{displayName}</span>
                        {user?.role && <span className={styles.role}>{t(`roles.${user.role}`, user.role)}</span>}
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}
