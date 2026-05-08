import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../NotificationItem/NotificationItem';
import styles from './NotificationPanel.module.css';

export default function NotificationPanel({ open, onClose }) {
	const { t } = useTranslation();
	const {
		notifications,
		pagination,
		unreadCount,
		markAsRead,
		markAllAsRead,
		fetchNotifications,
	} = useNotifications();

	useEffect(() => {
		if (open) fetchNotifications({ page: 1, limit: 20 });
	}, [open, fetchNotifications]);

	const handleLoadMore = useCallback(() => {
		const currentPage = pagination?.currentPage ?? pagination?.page ?? 1;
		const totalPages = pagination?.totalPages ?? 1;
		if (!pagination || currentPage >= totalPages) return;
		fetchNotifications({ page: currentPage + 1, limit: 20, append: true });
	}, [pagination, fetchNotifications]);

	if (!open) return null;

	const currentPage = pagination?.currentPage ?? pagination?.page ?? 1;
	const totalPages = pagination?.totalPages ?? 1;
	const hasMore = Boolean(pagination) && currentPage < totalPages;

	return (
		<>
			<div className={styles.backdrop} onClick={onClose} />
			<div className={styles.panel}>
				<div className={styles.header}>
					<h3 className={styles.title}>{t('notifications.title')}</h3>
					{unreadCount > 0 && (
						<button
							className={styles.markAllBtn}
							onClick={markAllAsRead}
							type="button"
						>
							{t('notifications.markAllRead')}
						</button>
					)}
				</div>

				<div className={styles.list}>
					{notifications.length === 0 ? (
						<p className={styles.empty}>{t('notifications.empty')}</p>
					) : (
						<>
							{notifications.map((n) => (
								<NotificationItem
									key={n.notification_id}
									notification={n}
									onRead={markAsRead}
								/>
							))}
							{hasMore && (
								<button
									className={styles.loadMoreBtn}
									onClick={handleLoadMore}
									type="button"
								>
									{t('notifications.loadMore')}
								</button>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
}
