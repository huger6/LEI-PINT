import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import Avatar from '../../Avatar/Avatar';
import ConfirmToast from '../../ConfirmToast/ConfirmToast';
import DropdownOption from '../DropdownOption/DropdownOption';
import styles from './UserDropdown.module.css';

export default function UserDropdown() {
    const { t } = useTranslation();
    const { logout } = useAuth();
    const { user, displayName } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const dropdownRef = useRef(null);

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
        navigate('/login');
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
                        to="/profile"
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
                        <DropdownOption
                            bootstrapIcon="bi-envelope"
                            label="userDropdown.mailSignature"
                            onClick={() => handleOptionClick('/mail-signature')}
                            role="menuitem"
                        />
                        <DropdownOption
                            bootstrapIcon="bi-person"
                            label="userDropdown.publicProfile"
                            onClick={() => handleOptionClick('/public-profile')}
                            role="menuitem"
                        />
                        <DropdownOption
                            bootstrapIcon="bi-circle-half"
                            label="userDropdown.colorMode"
                            onClick={() => handleOptionClick('/settings')}
                            role="menuitem"
                        />
                        <DropdownOption
                            bootstrapIcon="bi-shield"
                            label="userDropdown.privacy"
                            onClick={() => handleOptionClick('/privacy')}
                            role="menuitem"
                        />
                        <DropdownOption
                            bootstrapIcon="bi-lock"
                            label="userDropdown.security"
                            onClick={() => handleOptionClick('/security')}
                            role="menuitem"
                        />
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.menuSection}>
                        <DropdownOption
                            icon="settings"
                            label="userDropdown.settings"
                            onClick={() => handleOptionClick('/settings')}
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
