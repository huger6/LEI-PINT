import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEarnedBadgesForEvolution } from '../../../features/evolution/api/evolutionApi';
import { setBadgeFeatured } from '../../../features/gamification/api/gamificationApi';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import CelebrationModal from '../../../components/CelebrationModal/CelebrationModal';
import styles from './Achievements.module.css';

const MILESTONES = [1, 3, 5, 10, 25];
const CELEBRATED_KEY = 'softinsa.achievements.celebratedMilestone';

export default function Achievements() {
	// Initialize translation and navigation utilities
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	// Store the list of earned badges
	const [badges, setBadges] = useState([]);
	// Track whether the initial data fetch is in progress
	const [loading, setLoading] = useState(true);
	// Track whether the data fetch encountered an error
	const [error, setError] = useState(false);
	// Store the milestone count to celebrate, or null when not celebrating
	const [celebrate, setCelebrate] = useState(null);
	// Track which badge is currently being saved as featured
	const [savingFeatured, setSavingFeatured] = useState(null);

	// Curate the public gallery: toggle whether an earned badge is shown publicly.
	async function toggleFeatured(b) {
		if (!b.verificationLink) return;
		const next = !b.isFeatured;
		setSavingFeatured(b.awardedBadgeId);
		// Optimistic update; revert on failure.
		setBadges((prev) => prev.map((x) => (x.awardedBadgeId === b.awardedBadgeId ? { ...x, isFeatured: next } : x)));
		try {
			await setBadgeFeatured(b.verificationLink, next);
		} catch {
			setBadges((prev) => prev.map((x) => (x.awardedBadgeId === b.awardedBadgeId ? { ...x, isFeatured: !next } : x)));
		} finally {
			setSavingFeatured(null);
		}
	}

	// Fetch earned badges on mount and clean up on unmount
	useEffect(() => {
		let active = true;
		setLoading(true);
		getEarnedBadgesForEvolution()
			.then((data) => { if (active) setBadges(data || []); })
			.catch(() => { if (active) setError(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, []);

	// Celebrate once when a new milestone is reached (req 16). localStorage keeps
	// the last celebrated threshold so it does not re-fire on every visit.
	useEffect(() => {
		if (loading || error || badges.length === 0) return;
		const reached = MILESTONES.filter((m) => badges.length >= m).pop();
		if (!reached) return;
		const last = Number(localStorage.getItem(CELEBRATED_KEY) || 0);
		if (reached > last) {
			setCelebrate(reached);
			localStorage.setItem(CELEBRATED_KEY, String(reached));
		}
	}, [loading, error, badges.length]);

	// Compute the total points accumulated across all earned badges
	const totalPoints = useMemo(
		() => badges.reduce((sum, b) => sum + (b.pointsSnapshot ?? b.badge?.pointsValue ?? 0), 0),
		[badges],
	);
	// Determine the next milestone the user has not yet reached
	const nextMilestone = useMemo(
		() => MILESTONES.find((m) => m > badges.length) ?? null,
		[badges.length],
	);

	// Format an ISO date string into a human-readable locale date
	const fmtDate = (iso) => {
		if (!iso) return '—';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });
	};
	// Check whether a badge's expiration date has already passed
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
								<article
									key={b.awardedBadgeId}
									className={`${styles.card} ${badge.slug ? styles.cardClickable : ''}`}
									onClick={badge.slug ? () => navigate(`/badges/${badge.slug}`) : undefined}
									role={badge.slug ? 'button' : undefined}
									tabIndex={badge.slug ? 0 : undefined}
									onKeyDown={badge.slug ? (e) => { if (e.key === 'Enter') navigate(`/badges/${badge.slug}`); } : undefined}
								>
									<div className={styles.cardImg}>
										{badge.imageUrl ? <img src={badge.imageUrl} alt={badge.title || ''} /> : <Icon name="badge" size={32} color="var(--color-secondary)" aria-hidden="true" />}
										{b.isFeatured && <span className={styles.featured}><Icon name="star-points" size={12} aria-hidden="true" /> {t('achievements.featured')}</span>}
									</div>
									<div className={styles.cardBody}>
										<h3 className={styles.cardTitle}>{badge.title || '—'}</h3>
										<div className={styles.cardMeta}>
											<span className={styles.metaItem}><Icon name="clock" size={14} color="var(--color-outline)" aria-hidden="true" /> {fmtDate(b.awardedDate)}</span>
											<span className={styles.metaItem}><Icon name="star-points" size={14} color="var(--color-warning)" aria-hidden="true" /> {b.pointsSnapshot ?? badge.pointsValue ?? 0} pts</span>
										</div>
										{expired && <span className={styles.expired}>{t('achievements.expired')}</span>}
										{b.isPublished && b.verificationLink && (
											<div className={styles.cardActions}>
												<Button as="a" href={`${import.meta.env.API_URL}/public/badge/${b.verificationLink}`} target="_blank" rel="noopener" variant="text" size="sm"
													onClick={(e) => e.stopPropagation()}>
													<Icon name="eye" size={14} aria-hidden="true" /> {t('achievements.verify')}
												</Button>
												<Button
													variant="text"
													size="sm"
													loading={savingFeatured === b.awardedBadgeId}
													onClick={(e) => { e.stopPropagation(); toggleFeatured(b); }}
													title={t(b.isFeatured ? 'achievements.hideFromProfile' : 'achievements.showOnProfile')}
												>
													<Icon name={b.isFeatured ? 'bookmark-filled' : 'bookmark'} size={14} aria-hidden="true" />
													{t(b.isFeatured ? 'achievements.onProfile' : 'achievements.showOnProfile')}
												</Button>
											</div>
										)}
									</div>
								</article>
							);
						})}
					</div>
				</>
			)}

			{celebrate != null && (
				<CelebrationModal count={celebrate} onClose={() => setCelebrate(null)} />
			)}
		</div>
	);
}
