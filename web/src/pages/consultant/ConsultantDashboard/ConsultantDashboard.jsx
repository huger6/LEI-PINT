import { useState, useEffect, useRef } from 'react';
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

	// Fetch and sort the consultant's recent applications on mount
	useEffect(() => {
		let ignore = false;
		(async () => {
			try {
				const apps = await getApplications();
				const appList = Array.isArray(apps) ? apps : (apps.data || []);
				if (ignore) return;
				const sorted = [...appList].sort((a, b) =>
					new Date(b.submitted_at || b.opened_at || 0) - new Date(a.submitted_at || a.opened_at || 0));
				setRecentApps(sorted.slice(0, 4));
			} catch (err) {
				console.error(err);
			} finally {
				if (!ignore) setLoading(false);
			}
		})();
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

	// Scroll the recommendations carousel left or right by a fixed amount
	function scrollCarousel(dir) {
		carouselRef.current?.scrollBy({ left: dir === 'next' ? 320 : -320, behavior: 'smooth' });
	}

	return (
		<div className={styles.page}>
			<WelcomeCard />

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
		</div>
	);
}
