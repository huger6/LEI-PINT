import Icon from '../Icons/Icons';
import styles from './ContentCard.module.css';

/**
 * Card section header with an icon circle and title.
 * @param {string} [icon] - Icon name for the circle.
 * @param {ReactNode} [iconNode] - Custom icon element (overrides icon prop).
 * @param {string} [iconBg] - Background color of the icon circle.
 * @param {string} title - Header title text.
 */
export function CardHeader({ icon, iconNode, iconBg, iconColor, title }) {
	return (
		<div className={styles.header}>
			<div className={styles.iconCircle} style={{ background: iconBg }}>
				{iconNode || <Icon name={icon} size={20} color={iconColor} />}
			</div>
			<span className={styles.headerTitle}>{title}</span>
		</div>
	);
}

/**
 * Generic card container with rounded corners and shadow.
 * @param {string} [className] - Additional CSS classes.
 * @param {string|number} [padding] - Custom padding override.
 */
export default function ContentCard({ children, className = '', padding }) {
	return (
		<div
			className={`${styles.card} ${className}`.trim()}
			style={padding != null ? { padding } : undefined}
		>
			{children}
		</div>
	);
}
