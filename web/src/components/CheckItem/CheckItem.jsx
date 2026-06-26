import Icon from '../Icons/Icons';
import styles from './CheckItem.module.css';

/**
 * Checkmark list item with customizable color.
 * @param {string} [color] - Check icon color CSS value.
 */
export default function CheckItem({ children, color = 'var(--color-red-on-soft)' }) {
	return (
		<div className={styles.checkItem}>
			<Icon name="check" size={16} color={color} />
			<span className={styles.checkText}>{children}</span>
		</div>
	);
}
