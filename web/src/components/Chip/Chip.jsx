import Icon from '../Icons/Icons';
import styles from './Chip.module.css';

/**
 * Small removable tag/chip for displaying selected filters or tags.
 * @param {string} label - Chip display text.
 * @param {Function} [onRemove] - Called when the remove button is clicked. Hidden if omitted.
 */
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
