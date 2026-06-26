import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './RequirementCard.module.css';

/**
 * Badge requirement card showing title, description, and completion status.
 * @param {string} title - Requirement title (translated via TranslatedText).
 * @param {string} [description] - Requirement description.
 * @param {'pending'|'complete'} [status='pending'] - Completion status.
 */
// Renders a badge requirement card with completion status icon and translated content.
export default function RequirementCard({ title, description, status = 'pending' }) {
	// Provides translated status label strings.
	const { t } = useTranslation();
	const isComplete = status === 'complete';

	return (
		<div className={`${styles.card} ${isComplete ? styles.complete : styles.pending}`} aria-label={title}>
			<div className={styles.statusIcon}>
				{isComplete ? (
					<Icon name="check_circle" size={22} color="var(--color-success)" />
				) : (
					<span className={styles.emptyCircle} />
				)}
			</div>

			<div className={styles.body}>
				<div className={styles.header}>
					<h4 className={styles.title}><TranslatedText text={title} /></h4>
				</div>
				{description && <p className={styles.description}><TranslatedText text={description} /></p>}
				<span className={`${styles.statusLabel} ${isComplete ? styles.completeLabel : styles.pendingLabel}`}>
					{isComplete ? t('badgeDetail.complete') : t('badgeDetail.pending')}
				</span>
			</div>
		</div>
	);
}
