import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import styles from './SubStructureCard.module.css';

export default function SubStructureCard({ icon, title, description, count, isActive, tone }) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	return (
		<div className={`${styles.card} ${toneClass}`}>
			<div className={styles.iconWrap} aria-hidden="true">
				<Icon name={icon} size={28} />
			</div>
			<div className={styles.content}>
				<div className={styles.titleRow}>
					<h4 className={styles.title}>{title}</h4>
					{isActive !== undefined && (
						<span className={`${styles.badge} ${isActive ? styles.active : styles.inactive}`}>
							{isActive
								? t('shared.active', { defaultValue: 'Active' })
								: t('shared.inactive', { defaultValue: 'Inactive' })}
						</span>
					)}
				</div>
				{description && <p className={styles.description}>{description}</p>}
			</div>
			{count !== undefined && (
				<span className={styles.count}>{count}</span>
			)}
		</div>
	);
}
