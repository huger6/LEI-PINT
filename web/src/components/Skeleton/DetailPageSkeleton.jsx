import Skeleton from './Skeleton';
import styles from './Skeleton.module.css';

/** Skeleton placeholder for entity detail pages (badge detail, application detail). */
export default function DetailPageSkeleton() {
	return (
		<div role="status" aria-label="Loading">
			<div className={styles.detailBreadcrumb}>
				<Skeleton height={12} width={80} />
				<Skeleton height={12} width={8} />
				<Skeleton height={12} width={120} />
			</div>

			<div className="row g-4">
				<div className="col-lg-8">
					<div className={styles.detailMain}>
						<div className={styles.detailCard}>
							<div className={styles.detailImageBanner}>
								<Skeleton width={80} height={80} borderRadius={12} />
							</div>
							<div className={styles.detailCardBody}>
								<Skeleton height={22} width="55%" />
								<Skeleton height={14} width="100%" />
								<Skeleton height={14} width="80%" />
								<div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
									<Skeleton height={22} width={80} borderRadius={8} />
									<Skeleton height={22} width={64} borderRadius={8} />
								</div>
							</div>
						</div>

						<div className={styles.detailCard}>
							<div className={styles.detailCardBody}>
								<Skeleton height={18} width="35%" />
								{Array.from({ length: 3 }, (_, i) => (
									<div
										key={i}
										style={{
											padding: 12,
											borderRadius: 8,
											border: '1px solid #f0f2f4',
										}}
									>
										<Skeleton height={14} width="50%" />
										<Skeleton height={11} width="80%" style={{ marginTop: 8 }} />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="col-lg-4">
					<div className={styles.detailSidebar}>
						<Skeleton height={18} width="50%" />
						<Skeleton height={40} width="100%" borderRadius={10} />
						<Skeleton height={40} width="100%" borderRadius={10} />
					</div>
				</div>
			</div>
		</div>
	);
}
