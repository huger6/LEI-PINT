import styles from './BulletItem.module.css';

export default function BulletItem({ children, color = 'var(--color-green-on-soft)' }) {
	return (
		<div className={styles.bulletItem}>
			<span className={styles.bullet} style={{ color }}>•</span>
			<span className={styles.bulletText}>{children}</span>
		</div>
	);
}
