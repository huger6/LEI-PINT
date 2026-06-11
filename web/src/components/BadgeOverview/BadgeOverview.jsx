import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadges } from '../../features/badges/api/badgesApi';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import BadgeCard from '../BadgeCard/BadgeCard';
import CardGridSkeleton from '../Skeleton/CardGridSkeleton';
import styles from './BadgeOverview.module.css';

/**
 * Reusable overview of the badge point system (req 15/8) and the special /
 * premium achievement badges (req 16/9). Used by management roles
 * (Talent Manager / Service Line Leader). Self-fetching via GET /badges.
 */
export default function BadgeOverview() {
	const { t } = useTranslation();
	const [byPoints, setByPoints] = useState([]);
	const [special, setSpecial] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			try {
				const [points, specials] = await Promise.all([
					getBadges({ page: 1, limit: 100 }).catch(() => []),
					getBadges({ badgeClass: 'special', page: 1, limit: 50 }).catch(() => []),
				]);
				if (active) {
					setByPoints(points);
					setSpecial(specials);
				}
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	if (loading) return <CardGridSkeleton count={2} columns={2} />;

	return (
		<>
			{/* Points system per badge */}
			<ContentCard className={styles.card}>
				<CardHeader icon="star-points" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('tmStats.points.title')} />
				<p className={styles.note}>{t('tmStats.points.note')}</p>
				{byPoints.length === 0 ? (
					<p className={styles.empty}>{t('tmStats.noData')}</p>
				) : (
					<div className={`table-responsive ${styles.scrollTable}`}>
						<table className="table table-hover align-middle mb-0">
							<thead>
								<tr>
									<th>{t('tmStats.points.badge')}</th>
									<th>{t('tmStats.points.area')}</th>
									<th className="text-end">{t('tmStats.points.value')}</th>
								</tr>
							</thead>
							<tbody>
								{byPoints.map((b) => (
									<tr key={b.badge_slug || b.badge_id}>
										<td>{b.badge_title}</td>
										<td className="text-muted">{b.service_line?.service_line_name || b.area?.area_name || '—'}</td>
										<td className="text-end">
											<span className={styles.pointsValue}>{b.badge_points ?? 0} pts</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</ContentCard>

			{/* Special / Premium achievement badges */}
			<ContentCard className={styles.card}>
				<CardHeader icon="badge-premium" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('tmStats.special.title')} />
				<p className={styles.note}>{t('tmStats.special.note')}</p>
				{special.length === 0 ? (
					<p className={styles.empty}>{t('tmStats.special.empty')}</p>
				) : (
					<div className={styles.specialGrid}>
						{special.map((b) => (
							<BadgeCard
								key={b.badge_slug || b.badge_id}
								badge={b}
								to={`/badges/${b.badge_slug}`}
								isConsultant={false}
							/>
						))}
					</div>
				)}
			</ContentCard>
		</>
	);
}
