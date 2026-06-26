import ContentCard from '../ContentCard/ContentCard';
import Icon from '../Icons/Icons';
import styles from './PlaceholderPage.module.css';

/** Temporary placeholder page for features that are not yet implemented. */
// Renders a centered icon card indicating the page is under construction.
export default function PlaceholderPage({ icon = 'progress', title, description }) {
	return (
		<div className={styles.page}>
			{title && <h1 className={styles.pageTitle}>{title}</h1>}
			<ContentCard className={styles.card}>
				<div className={styles.iconCircle}>
					<Icon name={icon} size={28} color="var(--color-primary)" />
				</div>
				{description && <p className={styles.description}>{description}</p>}
			</ContentCard>
		</div>
	);
}
