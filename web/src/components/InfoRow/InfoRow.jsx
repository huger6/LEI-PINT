import Icon from '../Icons/Icons';
import styles from './InfoRow.module.css';

/**
 * Icon + text row for displaying profile or detail information.
 * @param {string} icon - Icon name displayed on the left.
 * @param {ReactNode} children - Text or content to display.
 */
// Renders a labeled icon-and-text row for profile detail display.
export default function InfoRow({ icon, children }) {
	return (
		<div className={styles.infoRow}>
			<Icon name={icon} size={20} color="var(--color-outline)" />
			<span className={styles.infoText}>{children}</span>
		</div>
	);
}
