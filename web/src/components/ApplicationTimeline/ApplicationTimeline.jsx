import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './ApplicationTimeline.module.css';

// System-generated logs are hidden from the user-facing timeline.
const SYSTEM_FUNCTIONS = ['trg_log_application_state_change', 'System'];

// Format a date string into a localized date and time string
function formatDateTime(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
		+ ' às '
		+ d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// Reusable validation / process-history timeline for a badge application.
// Renders the user-facing validation logs (most recent first) plus the
// "application started" entry. Shared by the consultant status and detail pages
// so a returned application shows its existing history in both views.
export default function ApplicationTimeline({ logs = [], openedAt, title }) {
	const { t } = useTranslation();

	const userLogs = logs.filter((l) => !SYSTEM_FUNCTIONS.includes(l.validator_function || l.validatorFunction));
	const sortedLogs = [...userLogs].sort(
		(a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
	);

	return (
		<div>
			<h2 className={styles.sectionTitle}>
				{title || t('applicationStatus.latestUpdates', { defaultValue: 'Latest Updates' })}
			</h2>
			<div className={styles.timeline}>
				{sortedLogs.length === 0 ? (
					<p className={styles.emptyText}>
						{t('applicationStatus.noUpdates', { defaultValue: 'No updates yet.' })}
					</p>
				) : (
					sortedLogs.map((log, idx) => {
						const isLatest = idx === 0;
						const action = log.validator_action || log.validatorAction || '';
						const role = log.validator_function || log.validatorFunction || '';
						const userName = log.user?.full_name || log.user?.fullName || '';
						const date = log.created_at || log.createdAt;
						const comment = log.validations_comments || log.validationsComments;

						return (
							<div key={log.log_id || idx} className={`${styles.timelineItem} ${isLatest ? styles.timelineLatest : ''}`}>
								<div className={`${styles.timelineIcon} ${isLatest ? styles.timelineIconLatest : ''}`}>
									{isLatest
										? <Icon name="send" size={16} color="#fff" />
										: <Icon name="clock" size={16} color="var(--color-outline)" />
									}
								</div>
								<div className={styles.timelineBody}>
									<div className={styles.timelineTitle}>
										<span>{action}</span>
										{isLatest && <span className={styles.latestBadge}>LATEST</span>}
									</div>
									{userName && (
										<div className={styles.timelineMeta}>
											<span className={styles.timelineUser}>{userName}</span>
											<span className={styles.timelineRole}>{role}</span>
										</div>
									)}
									{comment && <p className={styles.timelineComment}><TranslatedText text={comment} /></p>}
									{date && (
										<div className={styles.timelineDate}>
											<Icon name="clock" size={14} color="var(--color-outline)" />
											{formatDateTime(date)}
										</div>
									)}
								</div>
							</div>
						);
					})
				)}

				{/* Always show application opened entry */}
				<div className={styles.timelineItem}>
					<div className={styles.timelineIcon}>
						<Icon name="clock" size={16} color="var(--color-outline)" />
					</div>
					<div className={styles.timelineBody}>
						<div className={styles.timelineTitle}>
							{t('applicationStatus.applicationStarted', { defaultValue: 'Application started' })}
						</div>
						{openedAt && (
							<div className={styles.timelineDate}>
								<Icon name="clock" size={14} color="var(--color-outline)" />
								{formatDateTime(openedAt)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
