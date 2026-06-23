import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

/** Skeleton placeholder for structure detail pages (learning path, service line, area). */
export default function StructureDetailSkeleton() {
	return (
		<div role="status" aria-label="Loading">
			<div className={styles.detailBreadcrumb}>
				<Skeleton height={12} width={60} />
				<Skeleton height={12} width={8} />
				<Skeleton height={12} width={100} />
				<Skeleton height={12} width={8} />
				<Skeleton height={12} width={80} />
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
				<Skeleton height={28} width={240} />
				<Skeleton height={22} width={60} borderRadius={999} />
			</div>

			<div className={styles.structureGrid}>
				{/* Left panel - image + toolbar */}
				<div className={styles.structureLeftPanel}>
					<Skeleton
						height={0}
						width="100%"
						borderRadius={16}
						style={{ paddingBottom: '100%' }}
					/>
					<div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
						<Skeleton width={40} height={40} borderRadius={10} />
						<Skeleton width={40} height={40} borderRadius={10} />
						<Skeleton width={40} height={40} borderRadius={10} />
					</div>
				</div>

				{/* Right panel - description + stats */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
					<div className={styles.structureContentCard}>
						<Skeleton height={14} width={100} />
						<Skeleton height={12} width="100%" style={{ marginTop: 10 }} />
						<Skeleton height={12} width="85%" style={{ marginTop: 6 }} />
						<Skeleton height={12} width="60%" style={{ marginTop: 6 }} />
					</div>

					<div style={{ display: 'flex', gap: 12 }}>
						{Array.from({ length: 2 }, (_, i) => (
							<div key={i} className={styles.structureStatCard}>
								<Skeleton width={36} height={36} borderRadius={10} />
								<Skeleton height={10} width={60} style={{ marginTop: 8 }} />
								<Skeleton height={20} width={40} style={{ marginTop: 4 }} />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Sub-structures section */}
			<div style={{ marginTop: '2rem' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
					<Skeleton height={16} width={140} />
					<Skeleton height={32} width={120} borderRadius={8} />
				</div>
				<div className={styles.structureSubGrid}>
					{Array.from({ length: 4 }, (_, i) => (
						<div key={i} className={styles.structureSubCard}>
							<Skeleton height={14} width="60%" />
							<Skeleton height={11} width="80%" style={{ marginTop: 8 }} />
							<div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
								<Skeleton height={10} width={50} />
								<Skeleton height={10} width={50} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
