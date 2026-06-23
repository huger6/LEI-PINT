import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './StructureTypeCard.module.css';

/**
 * Card for selecting a structure entity type in the admin structure management page.
 * @param {string} title - Entity type name.
 * @param {string} icon - Icon name.
 * @param {string} to - Link to the entity type's list page.
 * @param {number} count - Total number of entities of this type.
 */
export default function StructureTypeCard({ to, icon, title, description, count, tone }) {
	const { t } = useTranslation();

	const renderCount = () => {
		if (count === '...') return <span className={`${styles.count} ${styles.loading}`}>...</span>;
		if (typeof count === 'string') return <span className={styles.count}>{count}</span>;
		if (count && typeof count === 'object') {
			return (
				<div className={styles.countGroup}>
					<span className={`${styles.countBadge} ${styles.activeBadge}`}>
						{count.active} {t('shared.active', { defaultValue: 'Active' })}
					</span>
					<span className={`${styles.countBadge} ${styles.inactiveBadge}`}>
						{count.inactive} {t('shared.inactive', { defaultValue: 'Inactive' })}
					</span>
				</div>
			);
		}
		return <span className={styles.count}>{count}</span>;
	};

	return (
		<Link to={to} className={styles.cardLink}>
			<article className={`${styles.card} ${styles[tone]}`}>
				<div className={styles.iconWrap} aria-hidden="true">
					<Icon name={icon} size={46} />
				</div>

				<div className={styles.mainInfo}>
					<div className={styles.titleRow}>
						<h2 className={styles.title}>{title}</h2>
						{renderCount()}
					</div>
					<p className={styles.description}><TranslatedText text={description} /></p>
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
