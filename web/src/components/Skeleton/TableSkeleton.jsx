import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

export default function TableSkeleton({ rows = 5, columns = 5 }) {
	return (
		<div role="status" aria-label="Loading">
			<table className={styles.skeletonTable}>
				<thead>
					<tr className={styles.skeletonTableHead}>
						{Array.from({ length: columns }, (_, i) => (
							<td key={i}>
								<Skeleton height={12} width={`${50 + Math.random() * 30}%`} />
							</td>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: rows }, (_, rowIdx) => (
						<tr key={rowIdx} className={styles.skeletonTableRow}>
							{Array.from({ length: columns }, (_, colIdx) => (
								<td key={colIdx}>
									{colIdx === 0 ? (
										<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
											<Skeleton width={32} height={32} circle />
											<div style={{ flex: 1 }}>
												<Skeleton height={12} width="70%" />
												<Skeleton height={10} width="50%" style={{ marginTop: 6 }} />
											</div>
										</div>
									) : colIdx === columns - 1 ? (
										<div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
											<Skeleton width={30} height={30} borderRadius={8} />
											<Skeleton width={30} height={30} borderRadius={8} />
										</div>
									) : (
										<Skeleton height={12} width={`${40 + (colIdx * 10) % 40}%`} />
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
