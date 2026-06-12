import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

export default function ListSkeleton({ rows = 5 }) {
	return (
		<div role="status" aria-label="Loading">
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className={styles.listItem}>
					<div style={{ flex: 1 }}>
						<Skeleton height={14} width={`${35 + (i * 12) % 30}%`} />
						<Skeleton height={11} width={`${50 + (i * 8) % 25}%`} style={{ marginTop: 8 }} />
					</div>
					<Skeleton width={14} height={14} borderRadius={4} />
				</div>
			))}
		</div>
	);
}
