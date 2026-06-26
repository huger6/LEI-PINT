import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../hooks/useNotifications';
import Tabs from '../../../../components/Tabs';
import NotificationItem from '../NotificationItem/NotificationItem';
import styles from './NotificationPanel.module.css';

const TAB_RECENT = 'recent';
const TAB_ALL = 'all';

/**
 * Slide-out notification panel with filtered tabs, infinite scroll, and mark-all-read action.
 */
export default function NotificationPanel({ open, onClose }) {
	// Translation helper.
	const { t } = useTranslation();
	// Notification state and action helpers from UserContext.
	const {
		notifications,
		pagination,
		unreadCount,
		markAsRead,
		markAllAsRead,
		fetchNotifications,
	} = useNotifications();

	// Currently selected tab (recent vs all).
	const [activeTab, setActiveTab] = useState(TAB_RECENT);

	// Loads the first page of notifications whenever the panel opens.
	useEffect(() => {
		if (open) fetchNotifications({ page: 1, limit: 20 });
	}, [open, fetchNotifications]);

	// Filters notifications shown based on the active tab.
	const visibleNotifications = useMemo(
		() =>
			activeTab === TAB_RECENT
				? notifications.filter((n) => !n.is_read)
				: notifications,
		[activeTab, notifications],
	);

	// Fetches and appends the next page of notifications if more exist.
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

	const tabs = [
		{ key: TAB_RECENT, label: t('notifications.tabs.recent'), badge: unreadCount },
		{ key: TAB_ALL, label: t('notifications.tabs.all') },
	];

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

				<Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

				<div className={styles.list}>
					{visibleNotifications.length === 0 ? (
						<p className={styles.empty}>
							{activeTab === TAB_RECENT
								? t('notifications.emptyRecent')
								: t('notifications.empty')}
						</p>
					) : (
						<>
							{visibleNotifications.map((n) => (
								<NotificationItem
									key={n.notification_id}
									notification={n}
									onRead={markAsRead}
									onNavigate={onClose}
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
