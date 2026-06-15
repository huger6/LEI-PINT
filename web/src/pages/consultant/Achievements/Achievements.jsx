import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEarnedBadgesForEvolution } from '../../../features/evolution/api/evolutionApi';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './Achievements.module.css';

const MILESTONES = [1, 3, 5, 10, 25];

export default function Achievements() {
	const { t, i18n } = useTranslation();
	const [badges, setBadges] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		getEarnedBadgesForEvolution()
			.then((data) => { if (active) setBadges(data || []); })
			.catch(() => { if (active) setError(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, []);

	const totalPoints = useMemo(
		() => badges.reduce((sum, b) => sum + (b.pointsSnapshot ?? b.badge?.pointsValue ?? 0), 0),
		[badges],
	);
	const nextMilestone = useMemo(
		() => MILESTONES.find((m) => m > badges.length) ?? null,
		[badges.length],
	);

	const fmtDate = (iso) => {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });
	};
	const isExpired = (iso) => iso && new Date(iso) < new Date();

	return (
		<div>
			<div className="mb-4">
				<h1 className="h3 mb-1">{t('achievements.title')}</h1>
				<p className="text-muted mb-0">{t('achievements.subtitle')}</p>
			</div>

			{loading ? (
				<CardGridSkeleton count={6} />
			) : error ? (
				<div className="alert alert-danger" role="alert">{t('achievements.loadFailed')}</div>
			) : badges.length === 0 ? (
				<div className={styles.empty}>
					<Icon name="trophy" size={40} aria-hidden="true" className="text-secondary mb-3" />
					<h5 className="text-muted">{t('achievements.emptyTitle')}</h5>
					<p className="text-muted small mb-3">{t('achievements.emptyDesc')}</p>
					<Button as={Link} to="/catalog">{t('achievements.exploreBadges')}</Button>
				</div>
			) : (
				<>
					{/* Summary */}
					<div className={styles.statsRow}>
						<div className={styles.statCard}>
							<Icon name="badge" size={22} color="var(--color-primary)" aria-hidden="true" />
							<div>
								<span className={styles.statValue}>{badges.length}</span>
								<span className={styles.statLabel}>{t('achievements.totalBadges')}</span>
							</div>
						</div>
						<div className={styles.statCard}>
							<Icon name="star-points" size={22} color="var(--color-warning)" aria-hidden="true" />
							<div>
								<span className={styles.statValue}>{totalPoints.toLocaleString(i18n.language)}</span>
								<span className={styles.statLabel}>{t('achievements.totalPoints')}</span>
							</div>
						</div>
						{nextMilestone && (
							<div className={styles.statCard}>
								<Icon name="target" size={22} color="var(--color-secondary)" aria-hidden="true" />
								<div>
									<span className={styles.statValue}>{nextMilestone - badges.length}</span>
									<span className={styles.statLabel}>{t('achievements.toNextMilestone', { count: nextMilestone })}</span>
								</div>
							</div>
						)}
					</div>

					{/* Milestones */}
					<div className={styles.milestones} aria-label={t('achievements.milestones')}>
						{MILESTONES.map((m) => {
							const reached = badges.length >= m;
							return (
								<div key={m} className={`${styles.milestone} ${reached ? styles.reached : ''}`}>
									<Icon name={reached ? 'trophy' : 'circle'} size={16} aria-hidden="true" />
									<span>{t('achievements.milestoneLabel', { count: m })}</span>
								</div>
							);
						})}
					</div>

					{/* Gallery */}
					<div className={styles.grid}>
						{badges.map((b) => {
							const badge = b.badge || {};
							const expired = isExpired(b.expirationDate);
							return (
								<article key={b.awardedBadgeId} className={styles.card}>
									<div className={styles.cardImg}>
										{badge.imageUrl ? <img src={badge.imageUrl} alt={badge.title || ''} /> : <Icon name="badge" size={32} color="var(--color-secondary)" aria-hidden="true" />}
										{b.isFeatured && <span className={styles.featured}><Icon name="star-points" size={12} aria-hidden="true" /> {t('achievements.featured')}</span>}
									</div>
									<div className={styles.cardBody}>
										<h3 className={styles.cardTitle}>{badge.title || '—'}</h3>
										<div className={styles.cardMeta}>
											<span><Icon name="clock" size={13} aria-hidden="true" /> {fmtDate(b.awardedDate)}</span>
											<span><Icon name="star-points" size={13} aria-hidden="true" /> {b.pointsSnapshot ?? badge.pointsValue ?? 0}</span>
										</div>
										{expired && <span className={styles.expired}>{t('achievements.expired')}</span>}
										<div className={styles.cardActions}>
											{badge.slug && (
												<Button as={Link} to={`/badges/${badge.slug}`} variant="outlined" size="sm">
													{t('achievements.viewBadge')}
												</Button>
											)}
											{b.isPublished && b.verificationLink && (
												<Button as="a" href={`/verify/${b.verificationLink}`} target="_blank" rel="noopener" variant="text" size="sm">
													<Icon name="eye" size={14} aria-hidden="true" /> {t('achievements.verify')}
												</Button>
											)}
										</div>
									</div>
								</article>
							);
						})}
					</div>
				</>
			)}
		</div>
	);
}
