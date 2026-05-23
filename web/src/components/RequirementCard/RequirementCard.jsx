import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './RequirementCard.module.css';

export default function RequirementCard({ title, description, status = 'pending', icon = 'area' }) {
	const { t } = useTranslation();
	const isComplete = status === 'complete';

	return (
		<div className={`${styles.card} ${isComplete ? styles.complete : styles.pending}`}>
			<div className={styles.statusIcon}>
				{isComplete ? (
					<Icon name="check_circle" size={22} color="var(--color-success)" />
				) : (
					<span className={styles.emptyCircle} />
				)}
			</div>

			<div className={styles.body}>
				<div className={styles.header}>
					<Icon name={icon} size={16} color="var(--color-secondary)" />
					<h4 className={styles.title}>{title}</h4>
					<Icon name="chevron_forward" size={16} color="var(--color-outline)" />
				</div>
				{description && <p className={styles.description}>{description}</p>}
				<span className={`${styles.statusLabel} ${isComplete ? styles.completeLabel : styles.pendingLabel}`}>
					{isComplete ? t('badgeDetail.complete') : t('badgeDetail.pending')}
				</span>
			</div>
		</div>
	);
}
