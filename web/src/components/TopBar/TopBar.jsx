import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../routes/paths';
import styles from './TopBar.module.css';
import Logo from '../Logo/Logo';
import { NotificationBell } from '../../features/notifications';
import { useUser } from '../../hooks/userContext';
import UserDropdown from './UserDropdown/UserDropdown';
import PointsCard from './PointsCard/PointsCard';
import SearchBar from './SearchBar/SearchBar';
import Icon from '../Icons/Icons';

/**
 * Application header bar with logo, search, points (consultant only), notifications, and user menu.
 * @param {Function} [onMenuToggle] - Called when the mobile hamburger menu is tapped.
 */
// Renders the application top bar with logo, search, points, notifications, and user menu.
export default function TopBar({ onMenuToggle }) {
    // Provides the current user object, display name, and gamification points.
    const { user, displayName, points } = useUser();
    const { t } = useTranslation();
    // Provides programmatic navigation for the search redirect.
    const navigate = useNavigate();

    // Navigates to the search results page with the given query string.
    const handleSearch = (query) => {
        if (!query) return;
        navigate(`${SHARED.SEARCH}?q=${encodeURIComponent(query)}`);
    };

    return (
        <header className={styles.topBar}>
            {onMenuToggle && (
                <button
                    type="button"
                    className={styles.menuToggle}
                    onClick={onMenuToggle}
                    aria-label={t('sidebar.menu')}
                >
                    <Icon name="hamburger" size={24} color="var(--color-on-background)" />
                </button>
            )}
            <Link to={SHARED.HOME} className={styles.logoSection}>
                <Logo />
            </Link>
            <div className={styles.searchSection}>
                <SearchBar
                    placeholder={t('topBar.searchPlaceholder')}
                    onSearch={handleSearch}
                />
            </div>
            <div className={styles.rightSection}>
                {
                    user?.role === 'Consultant' && (
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
