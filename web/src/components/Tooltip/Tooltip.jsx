import styles from './Tooltip.module.css';

/**
 * CSS-only tooltip that appears on hover.
 * @param {string} text - Tooltip text. If falsy, renders children without tooltip.
 * @param {'top'|'bottom'|'left'|'right'} [position='top'] - Tooltip placement.
 */
// Wraps children in a CSS tooltip bubble; renders children unwrapped if text is falsy.
export default function Tooltip({ text, position = 'top', children }) {
	if (!text) return children;

	return (
		<span className={styles.wrapper}>
			{children}
			<span className={`${styles.bubble} ${styles[position]}`}>{text}</span>
		</span>
	);
}
