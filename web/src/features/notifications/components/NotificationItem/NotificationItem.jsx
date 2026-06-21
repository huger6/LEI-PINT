import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

// Where each notification type takes the user when clicked.
const ROUTE_BY_TYPE = {
	HOME: '/',
	BADGES: '/catalog',
	APPLICATIONS: '/applications',
	ACHIEVEMENTS: '/achievements',
	POINTS: '/points',
	OBJECTIVES: '/objectives',
	EVOLUTION: '/evolution',
	ANNOUNCEMENTS: '/announcements',
	SYSTEM: '/settings',
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
		// Plain-text payload: use it as the message body.
		return { body: payload };
	}
}

export default function NotificationItem({ notification, onRead, onNavigate }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const payload = parseNotificationPayload(notification?.notification_payload);
	const notificationType = String(notification?.notification_type || 'SYSTEM').toUpperCase();
	const iconName = ICONS[notificationType] || ICONS.SYSTEM;
	const meta = payload.meta || {};
	const rawTitle = payload.title || payload.body || notification?.definition?.name || notificationType;
	const translated = t(rawTitle, { ns: 'api', defaultValue: '', ...meta });
	const message = translated || rawTitle;
	const sentAt = notification?.sent_at || notification?.created_at;

	// Deep-link: an explicit payload link wins, then a specific application,
	// otherwise the section that matches the notification type.
	const target = payload.link
		|| (meta.applicationGuid ? `/applications/${meta.applicationGuid}` : null)
		|| ROUTE_BY_TYPE[notificationType]
		|| '/';

	const handleClick = () => {
		if (!notification.is_read) onRead(notification.notification_id);
		onNavigate?.();
		navigate(target);
	};

	const handleMarkRead = (e) => {
		e.stopPropagation();
		if (!notification.is_read) onRead(notification.notification_id);
	};

	return (
		<div
			className={`${styles.item} ${notification.is_read ? styles.read : styles.unread}`}
			onClick={handleClick}
			onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
			role="button"
			tabIndex={0}
		>
			<span className={styles.iconWrapper}>
				<Icon name={iconName} className={styles.icon} size={16} color="currentColor" aria-label={notificationType} />
			</span>
			<div className={styles.content}>
				<p className={styles.message}>{message}</p>
				<span className={styles.time}>{timeAgo(sentAt, t)}</span>
			</div>
			{!notification.is_read && (
				<button
					type="button"
					className={styles.markReadBtn}
					onClick={handleMarkRead}
					aria-label={t('notifications.markRead', { defaultValue: 'Marcar como lida' })}
					title={t('notifications.markRead', { defaultValue: 'Marcar como lida' })}
				>
					<Icon name="check" size={14} color="currentColor" aria-hidden="true" />
				</button>
			)}
		</div>
	);
}
