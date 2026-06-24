import Icon from '../Icons/Icons';
import styles from './ProfileStatItem.module.css';

/**
 * Profile statistics card with icon, value, label, and optional footer.
 * @param {string} icon - Icon name.
 * @param {string} accentColor - Icon and value text color.
 * @param {string} accentBg - Background color for the icon circle.
 * @param {string|number} value - Stat value.
 * @param {string} label - Stat description.
 * @param {string} [footer] - Optional footer text below the value.
 */
export default function ProfileStatItem({ icon, accentColor, accentBg, value, label, footer }) {
	return (
		<div className={styles.statItem}>
			<span className={styles.statLabel}>{label}</span>
			<span className={styles.statValue} style={{ color: accentColor }}>{value ?? '—'}</span>
			<div className={styles.statIconCircle} style={{ background: accentBg }} />
			<div className={styles.statIcon}>
				<Icon name={icon} size={22} color={accentColor} />
			</div>
			{footer && <span className={styles.statFooter}>{footer}</span>}
		</div>
	);
}