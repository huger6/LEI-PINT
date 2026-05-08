import { useTranslation } from 'react-i18next';
import styles from './NotificationItem.module.css';

const ICONS = {
	badge: 'bi-award',
	achievement: 'bi-trophy',
	points: 'bi-star',
	announcement: 'bi-megaphone',
	system: 'bi-gear',
};

function timeAgo(dateString, t) {
	const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);

	if (seconds < 60) return t('notifications.timeAgo.now');
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return t('notifications.timeAgo.minutes', { count: minutes });
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return t('notifications.timeAgo.hours', { count: hours });
	const days = Math.floor(hours / 24);
	if (days < 7) return t('notifications.timeAgo.days', { count: days });
	return new Date(dateString).toLocaleDateString();
}

export default function NotificationItem({ notification, onRead }) {
	const { t } = useTranslation();
	const iconClass = ICONS[notification.type] || ICONS.system;

	const handleClick = () => {
		if (!notification.is_read) {
			onRead(notification.notification_id);
		}
	};

	return (
		<button
			className={`${styles.item} ${notification.is_read ? styles.read : styles.unread}`}
			onClick={handleClick}
			type="button"
		>
			<span className={styles.iconWrapper}>
				<i className={`bi ${iconClass} ${styles.icon}`} />
			</span>
			<div className={styles.content}>
				<p className={styles.message}>{notification.message}</p>
				<span className={styles.time}>{timeAgo(notification.created_at, t)}</span>
			</div>
			{!notification.is_read && <span className={styles.dot} />}
		</button>
	);
}
