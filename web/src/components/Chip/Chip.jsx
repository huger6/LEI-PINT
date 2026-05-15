import Icon from '../Icons/Icons';
import styles from './Chip.module.css';

export default function Chip({ label, onRemove }) {
	return (
		<span className={styles.chip}>
			<span className={styles.chipLabel}>{label}</span>
			{onRemove && (
				<button type="button" className={styles.chipRemove} onClick={onRemove} aria-label={`Remove ${label}`}>
					<Icon name="close" size={14} color="var(--color-blue-on-soft)" />
				</button>
			)}
		</span>
	);
}
