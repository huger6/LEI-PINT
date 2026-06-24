import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { AUTH, SHARED } from '../../../routes/paths';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import Avatar from '../../Avatar/Avatar';
import ConfirmToast from '../../ConfirmToast/ConfirmToast';
import DropdownOption from '../DropdownOption/DropdownOption';
import styles from './UserDropdown.module.css';

/** User avatar dropdown menu with profile link, theme toggle, settings, and logout. */
export default function UserDropdown() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { user, displayName } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // Light/dark theme toggle. Dark styling is not built yet, so this only flips
    // the preference + data-theme attribute (placeholder for the future theme).
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const dropdownRef = useRef(null);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        setOpen(false);
        await logout();
        navigate(AUTH.LOGIN);
    };

    const handleOptionClick = (path) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <div className={styles.wrapper} ref={dropdownRef}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={t('userDropdown.openMenu')}
            >
                <Avatar
                    src={user?.profileImg}
                    name={displayName}
                    size={36}
                    fallbackLabel={`${displayName} avatar`}
                />
            </button>

            {open && (
                <div className={styles.menu} role="menu">
                    <Link
                        to={SHARED.PROFILE}
                        className={styles.profileHeader}
                        onClick={() => setOpen(false)}
                        role="menuitem"
                    >
                        <Avatar
                            src={user?.profileImg}
                            name={displayName}
                            size={40}
                            fallbackLabel={`${displayName} avatar`}
                        />
                        <div className={styles.profileInfo}>
                            <span className={styles.profileLabel}>{t('userDropdown.seeProfile')}</span>
                            <span className={styles.profileUsername}>@{user?.username || displayName}</span>
                        </div>
                    </Link>

                    <div className={styles.menuSection}>
                        {
                            user.role !== 'Administrator' && (
                                <DropdownOption
                                    icon="email"
                                    iconSize={18}
                                    label="userDropdown.mailSignature"
                                    onClick={() => handleOptionClick(SHARED.MAIL_SIGNATURE)}
                                    role="menuitem"
                                />
                            )
                        }
                        {
                            // Public profile is the consultant microsite credential page;
                            // only Consultants have one.
                            user.role === 'Consultant' && user.guid && (
                                <DropdownOption
                                    icon="user"
                                    iconSize={18}
                                    label="userDropdown.publicProfile"
                                    onClick={() => handleOptionClick(`/softinsa/u/${user.guid}`)}
                                    role="menuitem"
                                />
                            )
                        }
                        <DropdownOption
                            icon={theme === 'dark' ? 'sun' : 'moon'}
                            iconSize={18}
                            label={theme === 'dark' ? 'userDropdown.lightMode' : 'userDropdown.darkMode'}
                            onClick={toggleTheme}
                            role="menuitem"
                        />
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.menuSection}>
                        <DropdownOption
                            icon="settings"
                            label="userDropdown.settings"
                            onClick={() => handleOptionClick(SHARED.SETTINGS)}
                            role="menuitem"
                        />
                        <DropdownOption
                            icon="exit-door"
                            label="userDropdown.exit"
                            onClick={() => setShowLogoutConfirm(true)}
                            role="menuitem"
                        />
                    </div>
                </div>
            )}

            <ConfirmToast
                open={showLogoutConfirm}
                message={t('confirmToast.logoutMessage')}
                confirmLabel={t('confirmToast.yes')}
                cancelLabel={t('confirmToast.no')}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </div>
    );
}
