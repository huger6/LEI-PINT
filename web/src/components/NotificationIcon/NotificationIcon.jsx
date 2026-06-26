import styles from './NotificationIcon.module.css';
import Icon from '../Icons/Icons';

/**
 * Bell icon with unread notification count badge.
 * @param {number} [count=0] - Number of unread notifications. Badge hidden when 0.
 */
// Renders a bell icon with a badge showing the unread notification count.
export default function NotificationIcon({ count = 0 }) {
    return (
        <div className={styles.notificationIcon}>
            <Icon name="bell" size={24} color="var(--color-on-background)" />
            {count > 0 && (
                <span className={`${styles.notificationCount} badge rounded-pill`}>
                    {count}
                </span>
            )}
        </div>
    );
}
