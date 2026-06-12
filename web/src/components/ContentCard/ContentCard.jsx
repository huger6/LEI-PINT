import Icon from '../Icons/Icons';
import styles from './ContentCard.module.css';

export function CardHeader({ icon, iconBg, iconColor, title }) {
	return (
		<div className={styles.header}>
			<div className={styles.iconCircle} style={{ background: iconBg }}>
				<Icon name={icon} size={20} color={iconColor} />
			</div>
			<span className={styles.headerTitle}>{title}</span>
		</div>
	);
}

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
