import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import styles from './StructureBreadcrumb.module.css';

/**
 * Breadcrumb navigation for structure detail pages (Learning Path > Service Line > Area > Level).
 * @param {Array} items - Breadcrumb entries: { label, to? }.
 */
export default function StructureBreadcrumb({ items }) {
	// Translation helper for i18n labels
	const { t } = useTranslation();

	if (!items || items.length === 0) return null;

	return (
		<nav aria-label={t('shared.breadcrumb', { defaultValue: 'Breadcrumb' })} className={styles.nav}>
			<ol className={styles.list}>
				<li className={styles.item}>
					<Link to={ADMIN.STRUCTURE} className={styles.link}>
						{t('shared.structureLabels.structure', { defaultValue: 'Structure' })}
					</Link>
				</li>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<li key={item.path} className={`${styles.item} ${isLast ? styles.active : ''}`}>
							{isLast ? (
								<span className={styles.current}>{item.label}</span>
							) : (
								<Link to={item.path} className={styles.link}>
									{item.label}
								</Link>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
