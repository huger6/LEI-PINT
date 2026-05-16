import Icon from '../../../../components/Icons/Icons';
import styles from './SubStructureCard.module.css';

export default function SubStructureCard({ icon, title, description, count, tone }) {
	const toneClass = tone ? styles[tone] : '';

	return (
		<div className={`${styles.card} ${toneClass}`}>
			<div className={styles.iconWrap} aria-hidden="true">
				<Icon name={icon} size={28} />
			</div>
			<div className={styles.content}>
				<h4 className={styles.title}>{title}</h4>
				{description && <p className={styles.description}>{description}</p>}
			</div>
			{count !== undefined && (
				<span className={styles.count}>{count}</span>
			)}
		</div>
	);
}
