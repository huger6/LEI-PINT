import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONSULTANT, SHARED } from '../../../routes/paths';
import { useUser } from '../../../hooks/userContext';
import WelcomeCard from '../../../components/WelcomeCard/WelcomeCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import { getBadgesCatalog } from '../../../features/badges/api/badgesApi';
import { getAreas } from '../../../features/badges/api/hierarchyApi';
import { getRewards } from '../../../features/rewards/api/rewardsApi';
import { getGoals } from '../../../features/goals/api/goalsApi';
import { getLearningPathProgress } from '../../../features/goals/api/statsApi';
import { useNotificationEvent } from '../../../features/notifications/hooks/useNotificationEvent';
import styles from './ConsultantDashboard.module.css';

// Localised "x days ago" without extra translation keys.
// Return a relative time string (e.g. "2 days ago") for a given date
function relativeTime(dateStr, lang) {
	if (!dateStr) return '';
	const diffDays = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
	const rtf = new Intl.RelativeTimeFormat(lang || 'pt', { numeric: 'auto' });
	if (Math.abs(diffDays) < 1) return rtf.format(0, 'day');
	if (Math.abs(diffDays) >= 7) return rtf.format(-Math.round(diffDays / 7), 'week');
	return rtf.format(-diffDays, 'day');
}

// Map an application state string to a display key and CSS class name
function statusOf(state) {
	if (state === 'Accepted') return { key: 'approved', cls: 'statusApproved' };
	if (state === 'Rejected') return { key: 'rejected', cls: 'statusRejected' };
	return { key: 'pending', cls: 'statusPending' };
}

// Consultant landing page: recent applications plus area-based badge recommendations
export default function ConsultantDashboard() {
	// Initialize translation and language utilities
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	// Access the current authenticated user
	const { user } = useUser();

	// Store the four most recent applications for the submissions section
	const [recentApps, setRecentApps] = useState([]);
	// Store badge recommendations based on the consultant's primary area
	const [recommendations, setRecommendations] = useState([]);
	// Track whether the initial data fetch is in progress
	const [loading, setLoading] = useState(true);
	// Hold a ref to the recommendations carousel DOM element for scrolling
	const carouselRef = useRef(null);
	// A few store rewards to spotlight as a carousel
	const [rewards, setRewards] = useState([]);
	// Ref to the rewards carousel for scrolling
	const rewardsRef = useRef(null);
	// The in-progress objective to continue (if any)
	const [continueGoal, setContinueGoal] = useState(null);
	// Learning-path completion progress (earned vs total badges per path)
	const [lpProgress, setLpProgress] = useState([]);

	// Fetch and sort the consultant's recent applications
	const loadRecentApps = useCallback(async () => {
		try {
			const apps = await getApplications();
			const appList = Array.isArray(apps) ? apps : (apps.data || []);
			const sorted = [...appList].sort((a, b) =>
				new Date(b.submitted_at || b.opened_at || 0) - new Date(a.submitted_at || a.opened_at || 0));
			setRecentApps(sorted.slice(0, 4));
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initial load of recent applications on mount
	useEffect(() => {
		loadRecentApps();
	}, [loadRecentApps]);

	// Real-time: refresh recent submissions when a validation step changes one of
	// the consultant's applications, keeping the dashboard status live (no reload).
	useNotificationEvent('APPLICATIONS', loadRecentApps);

	// Fetch learning-path progress on mount (only paths with badges are shown)
	useEffect(() => {
		let ignore = false;
		getLearningPathProgress()
			.then((data) => {
				if (ignore) return;
				const mapped = (data || [])
					.map((lp) => ({
						name: lp.path_title || lp.learning_path || '—',
						slug: lp.path_slug,
						completed: parseInt(lp.earned_badges ?? lp.badges_earned ?? 0, 10),
						total: parseInt(lp.total_badges ?? 0, 10),
					}))
					.filter((lp) => lp.total > 0)
					.sort((a, b) => (b.completed / b.total) - (a.completed / a.total));
				setLpProgress(mapped);
			})
			.catch(() => { if (!ignore) setLpProgress([]); });
		return () => { ignore = true; };
	}, []);

	// Recommendations: not-yet-earned badges in the consultant's primary area.
	// Fetch badge recommendations scoped to the consultant's primary area
	useEffect(() => {
		let ignore = false;
		(async () => {
			try {
				const primarySlug = user?.areas?.find(a => a.isPrimary)?.slug || user?.areas?.[0]?.slug;
				let areaId;
				if (primarySlug) {
					const areas = await getAreas({ limit: 100 }).catch(() => []);
					areaId = (areas || []).find(a => (a.area_slug || a.areaSlug) === primarySlug)?.area_id;
				}
				const { data } = await getBadgesCatalog(areaId ? { areaId, limit: 12 } : { limit: 12 });
				if (ignore) return;
				setRecommendations((data || []).filter(b => !(b.has_obtained === true)).slice(0, 9));
			} catch {
				if (!ignore) setRecommendations([]);
			}
		})();
		return () => { ignore = true; };
	}, [user]);

	// Spotlight a few store rewards (carousel) on the dashboard
	useEffect(() => {
		let ignore = false;
		getRewards()
			.then((store) => { if (!ignore) setRewards((store.rewards || []).slice(0, 9)); })
			.catch(() => { if (!ignore) setRewards([]); });
		return () => { ignore = true; };
	}, []);

	// Pick an in-progress objective to "continue" (one with a started application)
	useEffect(() => {
		let ignore = false;
		getGoals()
			.then((data) => {
				const list = Array.isArray(data) ? data : (data?.data || []);
				const inProgress = list.find((g) => g.application) || list[0] || null;
				if (!ignore) setContinueGoal(inProgress);
			})
			.catch(() => { if (!ignore) setContinueGoal(null); });
		return () => { ignore = true; };
	}, []);

	// Scroll a carousel (by ref) left or right by a fixed amount
	function scrollCarousel(dir, ref = carouselRef) {
		ref.current?.scrollBy({ left: dir === 'next' ? 320 : -320, behavior: 'smooth' });
	}

	return (
		<div className={styles.page}>
			<WelcomeCard />

			{/* Continue / propose an objective */}
			{continueGoal && (
				<section className={styles.goalBanner}>
					<div className={styles.goalIcon}><Icon name="target" size={24} color="var(--color-primary)" aria-hidden="true" /></div>
					<div className={styles.goalBody}>
						<span className={styles.goalLabel}>{continueGoal.application ? t('consultantDashboard.continueObjective') : t('consultantDashboard.proposedObjective')}</span>
						<span className={styles.goalName}>{continueGoal.badge_badge?.badge_title || continueGoal.event_title || '—'}</span>
					</div>
					<Button
						size="sm"
						onClick={() => navigate(
							continueGoal.application?.application_guid
								? `${SHARED.APPLICATIONS}/${continueGoal.application.application_guid}`
								: continueGoal.badge_badge?.badge_slug
									? `/badges/${continueGoal.badge_badge.badge_slug}`
									: CONSULTANT.OBJECTIVES
						)}
					>
						<Icon name="chevron_forward" size={14} /> {continueGoal.application ? t('consultantDashboard.resume') : t('consultantDashboard.start')}
					</Button>
				</section>
			)}

			{/* Recent submissions */}
			<section className={styles.section}>
				<div className={styles.sectionHead}>
					<h2 className={styles.sectionTitle}>{t('consultantDashboard.recentSubmissions')}</h2>
					<Link to={SHARED.APPLICATIONS} className={styles.viewAll}>{t('shared.viewAll')}</Link>
				</div>

				{loading ? (
					<div className={styles.subList}>
						{[0, 1, 2].map((i) => <div key={i} className={`${styles.subRow} ${styles.skeletonRow}`} />)}
					</div>
				) : recentApps.length === 0 ? (
					<div className={styles.emptyState}>
						<Icon name="paper" size={36} className={styles.emptyIcon} aria-hidden="true" />
						<p className={styles.emptyTitle}>{t('consultantDashboard.noApplications')}</p>
						<p className={styles.emptyHint}>{t('consultantDashboard.noApplicationsHint')}</p>
						<Button as={Link} to={CONSULTANT.CATALOG}>
							<Icon name="search" size={14} className="me-1" aria-hidden="true" />
							{t('consultantDashboard.exploreCatalog')}
						</Button>
					</div>
				) : (
					<div className={styles.subList}>
						{recentApps.map((app) => {
							const guid = app.application_guid || app.applicationGuid;
							const state = app.application_state || app.state;
							const st = statusOf(state);
							const title = app.badge?.badge_title || app.badge?.badgeTitle || '—';
							const img = app.badge?.badge_img_url || app.badge?.badgeImgUrl;
							return (
								<button key={guid} type="button" className={styles.subRow} onClick={() => navigate(`${SHARED.APPLICATIONS}/${guid}`)}>
									<span className={styles.subThumb}>
										{img ? <img src={img} alt="" /> : <Icon name="badge" size={22} color="var(--color-secondary)" aria-hidden="true" />}
									</span>
									<span className={styles.subInfo}>
										<span className={styles.subName}>{title}</span>
										<span className={styles.subTime}>{relativeTime(app.submitted_at || app.opened_at, i18n.language)}</span>
									</span>
									<span className={`${styles.statusChip} ${styles[st.cls]}`}>
										<Icon name={state === 'Accepted' ? 'check_circle' : state === 'Rejected' ? 'close_circle' : 'clock'} size={14} aria-hidden="true" />
										{t(`consultantDashboard.status.${st.key}`)}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</section>

			{/* Learning paths progress */}
			{lpProgress.length > 0 && (
				<section className={styles.section}>
					<div className={styles.sectionHead}>
						<h2 className={styles.sectionTitle}>{t('consultantDashboard.learningPathsProgress')}</h2>
						<Link to={CONSULTANT.OBJECTIVES} className={styles.viewAll}>{t('shared.viewAll')}</Link>
					</div>

					<div className={styles.lpList}>
						{lpProgress.map((lp) => {
							const pct = Math.min(100, Math.round((lp.completed / lp.total) * 100));
							const Wrapper = lp.slug ? Link : 'div';
							const wrapperProps = lp.slug ? { to: SHARED.STRUCTURE_LP_DETAIL.replace(':slug', lp.slug) } : {};
							return (
								<Wrapper key={lp.name} {...wrapperProps} className={styles.lpRow}>
									<div className={styles.lpInfo}>
										<span className={styles.lpName}>{lp.name}</span>
										<span className={styles.lpCount}>{lp.completed}/{lp.total}</span>
									</div>
									<div
										className={styles.lpTrack}
										role="progressbar"
										aria-valuenow={pct}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={lp.name}
									>
										<div className={styles.lpFill} style={{ width: `${pct}%` }} />
									</div>
								</Wrapper>
							);
						})}
					</div>
				</section>
			)}

			{/* Discover learning in your area */}
			{recommendations.length > 0 && (
				<section className={styles.section}>
					<div className={styles.sectionHead}>
						<h2 className={styles.sectionTitle}>{t('consultantDashboard.discoverInArea')}</h2>
						<div className={styles.carouselNav}>
							<button type="button" className={styles.navBtn} onClick={() => scrollCarousel('prev')} aria-label={t('shared.previous', { defaultValue: 'Anterior' })}>
								<Icon name="chevron_backward" size={18} aria-hidden="true" />
							</button>
							<button type="button" className={styles.navBtn} onClick={() => scrollCarousel('next')} aria-label={t('shared.next', { defaultValue: 'Seguinte' })}>
								<Icon name="chevron_forward" size={18} aria-hidden="true" />
							</button>
						</div>
					</div>

					<div className={styles.carousel} ref={carouselRef}>
						{recommendations.map((b) => {
							const slug = b.badge_slug || b.badgeSlug;
							const title = b.badge_title || b.badgeTitle;
							const img = b.badge_img_url || b.badgeImgUrl;
							const isSpecial = String(b.badge_type || b.badgeType || '').trim().toLowerCase() === 'special';
							return (
								<Link key={slug} to={`/badges/${slug}`} className={styles.recCard}>
									<div className={styles.recThumb}>
										{img ? <img src={img} alt="" loading="lazy" /> : <Icon name="badge" size={40} color="var(--color-secondary)" aria-hidden="true" />}
										{isSpecial && <span className={styles.recPremium} title="Special"><Icon name="star" size={14} color="#1d1b20" aria-hidden="true" /></span>}
									</div>
									<h3 className={styles.recTitle}>{title}</h3>
									<p className={styles.recDesc}>{b.badge_description || b.badgeDescription || ''}</p>
								</Link>
							);
						})}
					</div>
				</section>
			)}

			{/* Rewards spotlight */}
			{rewards.length > 0 && (
				<section className={styles.section}>
					<div className={styles.sectionHead}>
						<h2 className={styles.sectionTitle}>{t('consultantDashboard.rewardsSpotlight')}</h2>
						<div className={styles.carouselNav}>
							<button type="button" className={styles.navBtn} onClick={() => scrollCarousel('prev', rewardsRef)} aria-label={t('shared.previous', { defaultValue: 'Anterior' })}>
								<Icon name="chevron_backward" size={18} aria-hidden="true" />
							</button>
							<button type="button" className={styles.navBtn} onClick={() => scrollCarousel('next', rewardsRef)} aria-label={t('shared.next', { defaultValue: 'Seguinte' })}>
								<Icon name="chevron_forward" size={18} aria-hidden="true" />
							</button>
						</div>
					</div>

					<div className={styles.carousel} ref={rewardsRef}>
						{rewards.map((r) => (
							<Link key={r.rewardGuid} to={CONSULTANT.STORE || '/store'} className={styles.recCard}>
								<div className={`${styles.recThumb} ${styles.recThumbRect}`}>
									{r.imgUrl ? <img src={r.imgUrl} alt="" loading="lazy" /> : <Icon name="badge-premium" size={40} color="var(--color-purple-on-soft)" aria-hidden="true" />}
								</div>
								<h3 className={styles.recTitle}>{r.name}</h3>
								<p className={styles.recDesc}>
									<Icon name="star-points" size={13} color="var(--color-warning)" aria-hidden="true" /> {Number(r.costPoints).toLocaleString('pt-PT')} {t('store.points')}
								</p>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
