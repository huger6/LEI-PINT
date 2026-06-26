import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

/** Skeleton placeholder for a grid of cards (e.g. badge catalog loading state). */
export default function CardGridSkeleton({ count = 6, columns = 3 }) {
	const colClass = columns === 2 ? styles.gridCol2 : styles.gridCol3;

	return (
		<div className={`${styles.cardGrid} ${colClass}`} role="status" aria-label="Loading">
			{Array.from({ length: count }, (_, i) => (
				<div key={i} className={styles.skeletonCard}>
					<div className={styles.skeletonCardImage}>
						<Skeleton width={64} height={64} borderRadius={12} />
					</div>
					<div className={styles.skeletonCardBody}>
						<Skeleton height={16} width="75%" />
						<Skeleton height={12} width="100%" />
						<Skeleton height={12} width="60%" />
						<div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
							<Skeleton height={20} width={72} borderRadius={999} />
							<Skeleton height={20} width={56} borderRadius={999} />
						</div>
					</div>
					<div className={styles.skeletonCardFooter}>
						<div style={{ display: 'flex', gap: 8 }}>
							<Skeleton height={12} width={48} />
							<Skeleton height={12} width={36} />
						</div>
						<Skeleton height={12} width={40} />
					</div>
				</div>
			))}
		</div>
	);
}
