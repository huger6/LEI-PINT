import Icon from '../Icons/Icons';
import styles from './InfoRow.module.css';

export default function InfoRow({ icon, children }) {
	return (
		<div className={styles.infoRow}>
			<Icon name={icon} size={20} color="var(--color-outline)" />
			<span className={styles.infoText}>{children}</span>
		</div>
	);
}
