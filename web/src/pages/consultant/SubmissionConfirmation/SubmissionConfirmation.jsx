import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import Icon from '../../../components/Icons/Icons';
import styles from './SubmissionConfirmation.module.css';

export default function SubmissionConfirmation() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const {
		applicationGuid,
		badgeTitle,
		submittedAt,
	} = location.state || {};

	if (!applicationGuid) {
		navigate(SHARED.APPLICATIONS, { replace: true });
		return null;
	}

	const formattedDate = submittedAt
		? new Date(submittedAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
		: null;

	return (
		<div className={styles.page}>
			<nav className={styles.breadcrumb} aria-label={t('shared.breadcrumb')}>
				<Link to={SHARED.APPLICATIONS} className={styles.breadcrumbLink}>
					{t('applicationDetail.applications')}
				</Link>
				<span className={styles.breadcrumbSeparator}>
					<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				</span>
				<span className={styles.breadcrumbActive}>
					{t('submissionConfirmation.title')}
				</span>
			</nav>

			<div className={styles.card}>
				<div className={styles.iconCircle}>
					<Icon name="check_circle" size={48} color="var(--color-green-on-soft)" />
				</div>

				<h1 className={styles.heading}>
					{t('submissionConfirmation.heading')}
				</h1>

				{badgeTitle && (
					<p className={styles.badgeName}>
						{badgeTitle}
					</p>
				)}

				<p className={styles.message}>
					{t('submissionConfirmation.message')}
				</p>

				{formattedDate && (
					<div className={styles.timestampRow}>
						<Icon name="clock" size={16} color="var(--color-outline)" />
						<span className={styles.timestamp}>
							{t('submissionConfirmation.submittedOn', { date: formattedDate })}
						</span>
					</div>
				)}

				<div className={styles.infoBox}>
					<Icon name="help" size={18} color="var(--color-secondary)" />
					<p className={styles.infoText}>
						{t('submissionConfirmation.nextSteps')}
					</p>
				</div>

				<div className={styles.actions}>
					<button
						type="button"
						className={styles.primaryBtn}
						onClick={() => navigate(
							SHARED.APPLICATION_DETAIL.replace(':id', applicationGuid)
						)}
					>
						<Icon name="eye" size={16} color="#fff" />
						{t('submissionConfirmation.viewStatus')}
					</button>

					<button
						type="button"
						className={styles.secondaryBtn}
						onClick={() => navigate(SHARED.APPLICATIONS)}
					>
						{t('submissionConfirmation.backToApplications')}
					</button>
				</div>
			</div>
		</div>
	);
}
