import Icon from '../Icons/Icons';
import styles from './ProfileStatItem.module.css';

export default function ProfileStatItem({ icon, accentColor, accentBg, value, label, footer }) {
	return (
		<div className={styles.statItem}>
			<span className={styles.statLabel}>{label}</span>
			<span className={styles.statValue} style={{ color: accentColor }}>{value ?? '—'}</span>
			<div className={styles.statIconCircle} style={{ background: accentBg }}>
				<Icon name={icon} size={22} color={accentColor} />
			</div>
			{footer && <span className={styles.statFooter}>{footer}</span>}
		</div>
	);
}
