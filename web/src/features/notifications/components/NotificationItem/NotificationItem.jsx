import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import styles from './NotificationItem.module.css';

const ICONS = {
	HOME: 'home',
	BADGES: 'badge',
	APPLICATIONS: 'paper',
	ACHIEVEMENTS: 'trophy',
	POINTS: 'star',
	OBJECTIVES: 'target',
	EVOLUTION: 'evolution',
	ANNOUNCEMENTS: 'megaphone',
	SYSTEM: 'settings',
};

function timeAgo(dateString, t) {
	if (!dateString) return t('notifications.timeAgo.now');
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

function parseNotificationPayload(payload) {
	if (!payload) return {};
	if (typeof payload === 'object') return payload;
	if (typeof payload !== 'string') return {};

	try {
		return JSON.parse(payload);
	} catch {
		return {};
	}
}

export default function NotificationItem({ notification, onRead }) {
	const { t } = useTranslation();
	const payload = parseNotificationPayload(notification?.notification_payload);
	const notificationType = String(notification?.notification_type || 'SYSTEM').toUpperCase();
	const iconName = ICONS[notificationType] || ICONS.SYSTEM;
	const message = payload.title || payload.body || notification?.definition?.name || notificationType;
	const sentAt = notification?.sent_at || notification?.created_at;

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
				<Icon name={iconName} className={styles.icon} size={16} color="currentColor" label={notificationType} />
			</span>
			<div className={styles.content}>
				<p className={styles.message}>{message}</p>
				<span className={styles.time}>{timeAgo(sentAt, t)}</span>
			</div>
			{!notification.is_read && <span className={styles.dot} />}
		</button>
	);
}
