import styles from './Tooltip.module.css';

export default function Tooltip({ text, position = 'top', children }) {
	if (!text) return children;

	return (
		<span className={styles.wrapper}>
			{children}
			<span className={`${styles.bubble} ${styles[position]}`}>{text}</span>
		</span>
	);
}
