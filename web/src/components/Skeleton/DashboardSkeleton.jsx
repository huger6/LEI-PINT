import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

export default function DashboardSkeleton() {
	return (
		<div role="status" aria-label="Loading">
			<div className={styles.dashboardTitle}>
				<Skeleton height={24} width={220} />
				<Skeleton height={14} width={300} style={{ marginTop: 8 }} />
			</div>

			<div className={styles.dashboardStatsGrid}>
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} className={styles.dashboardStatCard}>
						<Skeleton width={40} height={40} borderRadius={10} />
						<div style={{ flex: 1 }}>
							<Skeleton height={11} width="60%" />
							<Skeleton height={22} width="40%" style={{ marginTop: 6 }} />
						</div>
					</div>
				))}
			</div>

			<div className={styles.dashboardContentGrid}>
				<div className={styles.dashboardContentCard}>
					<Skeleton height={18} width={180} />
					<div style={{ marginTop: 16 }}>
						{Array.from({ length: 4 }, (_, i) => (
							<div
								key={i}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									padding: '10px 0',
									borderBottom: '1px solid #f0f2f4',
								}}
							>
								<Skeleton height={12} width="40%" />
								<Skeleton height={20} width={64} borderRadius={999} />
								<Skeleton height={12} width="20%" />
							</div>
						))}
					</div>
				</div>
				<div className={styles.dashboardContentCard}>
					<Skeleton height={18} width={140} />
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
						<Skeleton height={38} width="100%" borderRadius={10} />
						<Skeleton height={38} width="100%" borderRadius={10} />
					</div>
				</div>
			</div>
		</div>
	);
}
