import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './StructureTypeCard.module.css';

export default function StructureTypeCard({ to, icon, title, description, count, tone }) {
	const { t } = useTranslation();

	return (
		<Link to={to} className={styles.cardLink}>
			<article className={`${styles.card} ${styles[tone]}`}>
				<div className={styles.iconWrap} aria-hidden="true">
					<Icon name={icon} size={46} />
				</div>

				<div className={styles.mainInfo}>
					<div className={styles.titleRow}>
						<h2 className={styles.title}>{title}</h2>
						<span className={styles.count}>{count}</span>
					</div>
					<p className={styles.description}>{description}</p>
				</div>

				<div className={styles.trailing}>
					<span className={styles.manageLabel}>
						{t('adminStructure.manageAction', { defaultValue: 'Manage' })}
					</span>
					<Icon name="chevron_forward" size={22} className={styles.manageIcon} />
				</div>
			</article>
		</Link>
	);
}
