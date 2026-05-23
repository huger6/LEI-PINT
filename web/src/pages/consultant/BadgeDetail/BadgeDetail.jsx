import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import { getBadgeBySlug, getBadges } from '../../../features/badges/api/badgesApi';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { startApplication, getApplications } from '../../../features/applications/api/applicationsApi';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import BadgeCard from '../../../components/BadgeCard/BadgeCard';
import RequirementCard from '../../../components/RequirementCard/RequirementCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './BadgeDetail.module.css';

export default function BadgeDetail() {
	const { t } = useTranslation();
	const { slug } = useParams();
	const navigate = useNavigate();
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [relatedBadges, setRelatedBadges] = useState([]);
	const [alreadyApplied, setAlreadyApplied] = useState(false);
	const [loading, setLoading] = useState(true);
	const [applying, setApplying] = useState(false);
	const [error, setError] = useState(null);
	const carouselRef = useRef(null);

	useEffect(() => {
		loadData();
	}, [slug]);

	async function loadData() {
		setLoading(true);
		try {
			const [badgeData, slData] = await Promise.all([
				getBadgeBySlug(slug),
				getServiceLines().catch(() => []),
			]);

			setBadge(badgeData);
			setServiceLines(slData);
			setRequirements(badgeData?.badge_requirements || badgeData?.badgeRequirements || []);

			const [apps, related] = await Promise.all([
				getApplications().catch(() => []),
				getBadges({ limit: 8 }).catch(() => []),
			]);

			const appList = apps.data || apps || [];
			const hasApp = appList.some(
				(a) =>
					(a.badge_id || a.badgeId) === (badgeData?.badge_id || badgeData?.badgeId) &&
					(a.application_state || a.state) !== 'Closed'
			);
			setAlreadyApplied(hasApp);

			const relatedList = (related.data || related || []).filter(
				(b) => (b.badge_slug || b.badgeSlug) !== slug
			);
			setRelatedBadges(relatedList.slice(0, 8));
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	async function handleApply() {
		setApplying(true);
		try {
			const newApp = await startApplication(badge.badge_id || badge.badgeId);
			const appGuid = newApp.application_guid || newApp.applicationGuid;
			navigate(`${SHARED.APPLICATIONS}/${appGuid}`);
		} catch (err) {
			setError(err.message);
			setApplying(false);
		}
	}

	function scrollCarousel(direction) {
		if (!carouselRef.current) return;
		const scrollAmount = 280;
		carouselRef.current.scrollBy({
			left: direction === 'next' ? scrollAmount : -scrollAmount,
			behavior: 'smooth',
		});
	}

	if (loading) return <DetailPageSkeleton />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('shared.error')}: {error}
			</div>
		);
	}

	if (!badge) {
		return (
			<div className="text-center py-5">
				<h5 className="text-muted">{t('badgeDetail.notFound')}</h5>
				<Link to={SHARED.BADGES}>{t('badgeDetail.backToCatalog')}</Link>
			</div>
		);
	}

	const title = badge.badge_title || badge.badgeTitle;
	const description = badge.badge_description || badge.badgeDescription;
	const points = badge.badge_points || badge.badgePoints;
	const imgUrl = badge.badge_img_url || badge.badgeImgUrl;
	const hours = badge.estimated_hours || badge.estimatedHours;
	const expirationDate = badge.expiration_date || badge.expirationDate;

	const serviceLine = badge.service_line || badge.serviceLine;
	const serviceLineName = serviceLine?.service_line_name || serviceLine?.serviceLineName;
	const learningPath = badge.learning_path || badge.learningPath;
	const learningPathName = learningPath?.path_title || learningPath?.pathTitle;
	const area = badge.area || {};
	const areaName = area.area_name || area.areaName;
	const stage = badge.progression_stage || badge.progressionStage;
	const stageCode = stage?.stage_code?.stage_code || stage?.stageCode?.stageCode;
	const stageTitle = stage?.stage_title || stage?.stageTitle;

	const completedCount = requirements.filter(
		(r) => r.status === 'complete' || r.status === 'completed' || r.is_completed
	).length;

	const progressPercent = requirements.length > 0
		? Math.round((completedCount / requirements.length) * 100)
		: 0;

	const breadcrumbItems = [
		{ label: t('badgeDetail.catalog'), to: SHARED.BADGES },
		...(learningPathName ? [{ label: learningPathName }] : []),
		...(serviceLineName ? [{ label: serviceLineName }] : []),
		{ label: title, active: true },
	];

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav aria-label={t('shared.breadcrumb')} className={styles.breadcrumb}>
				<ol className="breadcrumb mb-0">
					{breadcrumbItems.map((item, i) => (
						<li
							key={i}
							className={`breadcrumb-item${item.active ? ' active fw-semibold' : ''}`}
							{...(item.active ? { 'aria-current': 'page' } : {})}
						>
							{item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
						</li>
					))}
				</ol>
			</nav>

			{/* ── Section 1: Badge Header ── */}
			<section className={styles.heroCard}>
				<div className={styles.heroImageWrap}>
					{imgUrl ? (
						<img src={imgUrl} alt={title} className={styles.heroImage} />
					) : (
						<div className={styles.heroImageFallback}>
							<Icon name="badge" size={64} color="var(--color-secondary)" />
						</div>
					)}
				</div>

				<div className={styles.heroBody}>
					<h1 className={styles.heroTitle}>{title}</h1>
					<p className={styles.heroDescription}>
						{description || t('badgeDetail.noDescription')}
					</p>

					<div className={styles.chipRow}>
						{points != null && (
							<span className={`${styles.chip} ${styles.chipPoints}`}>
								<Icon name="star-points" size={16} />
								+ {points} {t('badgeDetail.pointsLabel')}
							</span>
						)}
						{(stageCode || stageTitle) && (
							<span className={styles.chip}>
								<Icon name="evolution" size={16} />
								{stageTitle || stageCode}
								{stageCode && stageTitle ? ` (${stageCode})` : ''}
							</span>
						)}
						{serviceLineName && (
							<span className={styles.chip}>
								<Icon name="service-line" size={16} />
								{serviceLineName}
							</span>
						)}
						{hours && (
							<span className={`${styles.chip} ${styles.chipHours}`}>
								<Icon name="clock" size={16} />
								{hours}{t('badgeDetail.hours')}
							</span>
						)}
					</div>

					<div className={styles.actionRow}>
						{alreadyApplied ? (
							<Button disabled className={styles.actionBtn}>
								{t('badgeDetail.alreadyApplied')}
							</Button>
						) : (
							<Button onClick={handleApply} loading={applying} className={styles.actionBtn}>
								<Icon name="send" size={16} />
								{t('badgeDetail.applyNow')}
							</Button>
						)}
						<Button variant="outlined" color="success" className={styles.actionBtn}>
							<Icon name="target" size={16} />
							{t('badgeDetail.addObjective')}
						</Button>
						<Button variant="outlined" className={styles.actionBtnLinkedIn}>
							<Icon name="linkedin" size={16} />
							{t('badgeDetail.shareLinkedIn')}
						</Button>
					</div>
				</div>
			</section>

			{/* ── Section 2: Rewards ── */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('badgeDetail.rewards')}</h2>
				<p className={styles.sectionDesc}>{t('badgeDetail.rewardsDescription')}</p>

				<div className={styles.rewardsGrid}>
					<div className={styles.rewardsList}>
						<div className={styles.rewardItem}>
							<div className={styles.rewardIcon}>
								<Icon name="certificate" size={20} color="var(--color-secondary)" />
							</div>
							<div>
								<strong>{t('badgeDetail.certificatePdf')}</strong>
								<p className={styles.rewardDesc}>{t('badgeDetail.certificateDesc')}</p>
							</div>
						</div>
						<div className={styles.rewardItem}>
							<div className={styles.rewardIcon}>
								<Icon name="badge-premium" size={20} color="var(--color-secondary)" />
							</div>
							<div>
								<strong>{t('badgeDetail.specialTitle')}</strong>
								<p className={styles.rewardDesc}>
									&quot;{learningPathName ? `Pioneiro ${serviceLineName || ''} Softinsa` : 'Especialista Softinsa'}&quot;
								</p>
							</div>
						</div>
					</div>

					<div className={styles.badgePreview}>
						{imgUrl ? (
							<img src={imgUrl} alt={title} className={styles.badgePreviewImg} />
						) : (
							<Icon name="badge" size={80} color="var(--color-secondary)" />
						)}
						<span className={styles.badgePreviewLabel}>{title}</span>
					</div>
				</div>
			</section>

			{/* ── Section 3: Competencies + Service Lines ── */}
			<div className={styles.twoColumn}>
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>{t('badgeDetail.competencies')}</h2>
					<p className={styles.sectionDesc}>{t('badgeDetail.competenciesDescription')}</p>

					<ul className={styles.competencyList}>
						{(badge.badge_competencies || badge.badgeCompetencies || []).length > 0
							? (badge.badge_competencies || badge.badgeCompetencies).map((c, i) => (
								<li key={i} className={styles.competencyItem}>
									<Icon name="check_circle" size={18} color="var(--color-primary)" />
									{c.competency_name || c.competencyName || c.name || c}
								</li>
							))
							: (
								<>
									<li className={styles.competencyItem}>
										<Icon name="check_circle" size={18} color="var(--color-primary)" />
										{areaName || serviceLineName || 'N/A'}
									</li>
								</>
							)
						}
					</ul>
				</section>

				<aside className={styles.serviceLinesCard}>
					<h3 className={styles.serviceLineTitle}>{t('badgeDetail.exploreServiceLines')}</h3>
					<ul className={styles.serviceLineList}>
						{serviceLines.map((sl) => (
							<li key={sl.service_line_id || sl.serviceLineId} className={styles.serviceLineItem}>
								<Icon name="service-line" size={18} color="var(--color-outline)" />
								<span>{sl.service_line_name || sl.serviceLineName}</span>
								<Icon name="chevron_forward" size={16} color="var(--color-outline)" />
							</li>
						))}
					</ul>
				</aside>
			</div>

			{/* ── Section 4: Requirements ── */}
			<section className={styles.section}>
				<div className={styles.requirementsHeader}>
					<div>
						<h2 className={styles.sectionTitle}>{t('badgeDetail.requirements')}</h2>
						<p className={styles.sectionDesc}>{t('badgeDetail.requirementsDescription')}</p>
					</div>
					{expirationDate && (
						<span className={styles.expirationBadge}>
							<Icon name="clock" size={18} color="var(--color-warning)" />
							{t('badgeDetail.expiresOn')}: {new Date(expirationDate).toLocaleDateString('pt-PT', {
								day: 'numeric', month: 'short', year: 'numeric'
							})}
						</span>
					)}
				</div>

				{requirements.length > 0 && (
					<div className={styles.progressBlock}>
						<div className={styles.progressMeta}>
							<span>{t('badgeDetail.progress')}</span>
							<span>{completedCount}/{requirements.length} {t('badgeDetail.completed')}</span>
						</div>
						<div className={styles.progressTrack}>
							<div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
						</div>
					</div>
				)}

				{requirements.length === 0 ? (
					<p className="text-muted small">{t('badgeDetail.noRequirements')}</p>
				) : (
					<div className={styles.requirementsGrid}>
						{requirements.map((req, idx) => {
							const reqTitle = req.requirement_title || req.requirementTitle || t('badgeDetail.requirementN', { n: idx + 1 });
							const reqDesc = req.requirement_description || req.requirementDescription || '';
							const reqStatus = req.status === 'complete' || req.status === 'completed' || req.is_completed
								? 'complete'
								: 'pending';
							return (
								<RequirementCard
									key={req.requirement_id || req.requirementId || idx}
									title={reqTitle}
									description={reqDesc}
									status={reqStatus}
									icon="area"
								/>
							);
						})}
					</div>
				)}
			</section>

			{/* ── Section 5: Related Badges ── */}
			{relatedBadges.length > 0 && (
				<section className={styles.relatedSection}>
					<div className={styles.relatedHeader}>
						<h2 className={styles.sectionTitle}>{t('badgeDetail.related')}</h2>
						<div className={styles.carouselControls}>
							<button
								type="button"
								className={styles.carouselBtn}
								onClick={() => scrollCarousel('prev')}
								aria-label="Previous"
							>
								<Icon name="chevron_backward" size={18} />
							</button>
							<button
								type="button"
								className={styles.carouselBtn}
								onClick={() => scrollCarousel('next')}
								aria-label="Next"
							>
								<Icon name="chevron_forward" size={18} />
							</button>
						</div>
					</div>
					<div className={styles.carousel} ref={carouselRef}>
						{relatedBadges.map((b) => (
							<div
								key={b.badge_slug || b.badgeSlug || b.badge_id || b.badgeId}
								className={styles.carouselItem}
							>
								<BadgeCard
									badge={b}
									to={`${SHARED.BADGES}/${b.badge_slug || b.badgeSlug}`}
								/>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
