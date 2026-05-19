import Icon from '../../../../components/Icons/Icons';
import styles from './StructureStatCard.module.css';

export default function StructureStatCard({ icon, label, value, accentColor, accentBg }) {
	return (
		<div className={styles.card}>
			<div className={styles.topRow}>
				<div className={styles.iconWrap} style={{ background: accentBg }}>
					<Icon name={icon} size={22} color={accentColor} />
				</div>
				<span className={styles.value} style={{ color: accentColor }}>{value}</span>
			</div>
			<span className={styles.label}>{label}</span>
		</div>
	);
}
