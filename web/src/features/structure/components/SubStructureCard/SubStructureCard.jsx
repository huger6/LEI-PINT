import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Icon from '../../../../components/Icons/Icons';
import Tooltip from '../../../../components/Tooltip/Tooltip';
import styles from './SubStructureCard.module.css';

/**
 * Card for displaying child entities within a parent structure detail page.
 * @param {Object} item - Child entity data.
 * @param {string} to - Link to the child entity's detail page.
 */
export default function SubStructureCard({ icon, title, description, count, isActive, tone, to, infoItems }) {
	const { t } = useTranslation();
	const toneClass = tone ? styles[tone] : '';

	const content = (
		<>
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
				{infoItems && infoItems.length > 0 && (
					<div className={styles.infoStrip}>
						{infoItems.map((info) => (
							<Tooltip key={info.label} text={info.label}>
								<span className={styles.infoItem}>
									<Icon name={info.icon} size={15} />
									<span className={styles.infoValue}>{info.value ?? 0}</span>
								</span>
							</Tooltip>
						))}
					</div>
				)}
			</div>
			{count !== undefined && (
				<span className={styles.count}>{count}</span>
			)}
		</>
	);

	if (to) {
		return (
			<Link to={to} className={`${styles.card} ${toneClass}`}>
				{content}
			</Link>
		);
	}

	return (
		<div className={`${styles.card} ${toneClass}`}>
			{content}
		</div>
	);
}
