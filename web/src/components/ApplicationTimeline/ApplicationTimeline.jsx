import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './ApplicationTimeline.module.css';

// System-generated logs are hidden from the user-facing timeline.
const SYSTEM_FUNCTIONS = ['trg_log_application_state_change', 'System'];

// Maps the raw validator_action strings stored by the API to localized i18n keys.
// Keeps the audit trail values intact in the DB while showing translated, consistent
// labels (e.g. "Accept" -> "Accepted"/"Aceite") in the UI. Unknown actions fall back
// to the raw string.
const ACTION_LABEL_KEYS = {
	'Open -> Submitted': 'applicationStatus.actions.submitted',
	'Request Review': 'applicationStatus.actions.requestReview',
	'Accept': 'applicationStatus.actions.accepted',
	'Reject': 'applicationStatus.actions.rejected',
	'Send Back': 'applicationStatus.actions.sendBack',
	'Approve Evidence': 'applicationStatus.actions.approveEvidence',
	'Reject Evidence': 'applicationStatus.actions.rejectEvidence',
};

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
		(a, b) => new Date(b.validated_at || b.validatedAt) - new Date(a.validated_at || a.validatedAt)
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
						const rawAction = log.validator_action || log.validatorAction || '';
						const action = ACTION_LABEL_KEYS[rawAction] ? t(ACTION_LABEL_KEYS[rawAction]) : rawAction;
						const role = log.validator_function || log.validatorFunction || '';
						const userName = log.user?.full_name || log.user?.fullName || '';
						const date = log.validated_at || log.validatedAt;
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
