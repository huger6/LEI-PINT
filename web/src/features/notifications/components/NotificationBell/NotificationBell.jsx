import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import Icon from '../../../../components/Icons/Icons';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
	const { t } = useTranslation();
	const { unreadCount } = useNotifications();
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === 'Escape') setOpen(false);
		};
		if (open) document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [open]);

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				className={`${styles.bellButton} ${open ? styles.bellButtonActive : ''}`}
				onClick={() => setOpen((prev) => !prev)}
				aria-label={t('notifications.bell')}
				aria-expanded={open}
				type="button"
			>
				<Icon name="bell" size={22} color="var(--color-on-background)" />
				{unreadCount > 0 && (
					<span className={styles.badge}>
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				)}
			</button>
			<NotificationPanel open={open} onClose={() => setOpen(false)} />
		</div>
	);
}
