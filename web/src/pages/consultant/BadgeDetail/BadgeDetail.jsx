import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, CONSULTANT } from '../../../routes/paths';
import { getBadgeBySlug, getBadges } from '../../../features/badges/api/badgesApi';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { startApplication, getApplications } from '../../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import BadgeCard from '../../../components/BadgeCard/BadgeCard';
import RequirementCard from '../../../components/RequirementCard/RequirementCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import { useUser } from '../../../hooks/userContext';
import styles from './BadgeDetail.module.css';

export default function BadgeDetail() {
	const { user } = useUser();
	const { t } = useTranslation();
	const { slug } = useParams();
	const navigate = useNavigate();
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [relatedBadges, setRelatedBadges] = useState([]);
	const [existingAppGuid, setExistingAppGuid] = useState(null);
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

			const serviceLineId = badgeData?.service_line_id || badgeData?.serviceLineId;

			const [apps, related] = await Promise.all([
				getApplications().catch(() => []),
				getBadges(serviceLineId ? { serviceLineId, limit: 8 } : { limit: 8 }).catch(() => []),
			]);

			const appList = apps.data || apps || [];
			const activeApp = appList.find(
				(a) =>
					(a.badge_id || a.badgeId) === (badgeData?.badge_id || badgeData?.badgeId) &&
					!['Accepted', 'Rejected'].includes(a.application_state || a.state)
			);
			setExistingAppGuid(activeApp ? (activeApp.application_guid || activeApp.applicationGuid) : null);

			const relatedList = (related.data || related || []).filter(
				(b) => (b.badge_slug || b.badgeSlug) !== slug
			);
			setRelatedBadges(relatedList.slice(0, 8));
		} catch (err) {
			setError(resolveErrorMessage(err));
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
			setError(resolveErrorMessage(err));
			setApplying(false);
		}
	}

	function handleShareLinkedIn() {
		const badgeTitle = badge.badge_title || badge.badgeTitle;
		const verificationLink = badge.user_award?.public_verification_link;

		const shareUrl = verificationLink
			? `${window.location.origin}/verify/${verificationLink}`
			: window.location.href;

		const shareText = t('badgeDetail.linkedInShareText', { badgeTitle, url: shareUrl });
		const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
		window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
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
				{error}
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
	const expirationDays = badge.expiration_duration_days ?? badge.expirationDurationDays;

	const serviceLine = badge.service_line || badge.serviceLine;
	const serviceLineName = serviceLine?.service_line_name || serviceLine?.serviceLineName;
	const learningPath = badge.learning_path || badge.learningPath;
	const learningPathName = learningPath?.path_title || learningPath?.pathTitle;
	const stage = badge.progression_stage || badge.progressionStage;
	const stageCode = stage?.stage_code?.stage_code || stage?.stageCode?.stageCode;
	const stageTitle = stage?.stage_title || stage?.stageTitle;

	const skills = badge.skills || [];
	const rewards = badge.rewards || [];
	const userAward = badge.user_award;
	const hasObtained = !!userAward;

	const specialTitleReward = rewards.find((r) => r.special_title);

	const completedCount = requirements.filter(
		(r) => r.status === 'complete' || r.status === 'completed' || r.is_completed
	).length;

	const progressPercent = requirements.length > 0
		? Math.round((completedCount / requirements.length) * 100)
		: 0;

	const breadcrumbItems = [
		{ label: t('navbar.consultant.home'), to: SHARED.HOME },
		...(learningPathName ? [{ label: learningPathName, to: SHARED.BADGES }] : []),
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
						{expirationDays && (() => {
							if (hasObtained && userAward.expiration_at) {
								const remaining = Math.ceil(
									(new Date(userAward.expiration_at) - new Date()) / (1000 * 60 * 60 * 24)
								);
								const isExpired = remaining <= 0;
								return (
									<span className={`${styles.chip} ${isExpired ? styles.chipExpired : styles.chipExpiration}`}>
										<Icon name="clock" size={16} />
										{isExpired
											? t('badgeDetail.expired')
											: `${remaining} ${t('badgeDetail.remainingDays')}`
										}
									</span>
								);
							}
							return (
								<span className={`${styles.chip} ${styles.chipExpiration}`}>
									<Icon name="clock" size={16} />
									{expirationDays} {t('badgeDetail.validDays')}
								</span>
							);
						})()}
					</div>

					<div className={styles.actionRow}>
						{existingAppGuid ? (
							<Button
								className={styles.actionBtn}
								onClick={() => navigate(`${SHARED.APPLICATIONS}/${existingAppGuid}`)}
							>
								<Icon name="paper" size={16} />
								{t('badgeDetail.seeApplication')}
							</Button>
						) : (
							<Button onClick={handleApply} loading={applying} className={styles.actionBtn}>
								<Icon name="send" size={16} />
								{t('badgeDetail.applyNow')}
							</Button>
						)}
						<Button
							variant="filled"
							className={styles.actionBtnObjective}
							onClick={() => navigate(CONSULTANT.OBJECTIVES)}
						>
							<Icon name="target" size={16} />
							{t('badgeDetail.addObjective')}
						</Button>
						<Button variant="outlined" className={styles.actionBtnLinkedIn} onClick={handleShareLinkedIn}>
							<Icon name="linkedin" size={16} />
							{t('badgeDetail.shareLinkedIn')}
						</Button>
						{hasObtained && (
							<div className={styles.obtainedIndicator} title={t('badgeDetail.complete')}>
								<Icon name="trophy" size={28} color="var(--color-badge-premium)" />
							</div>
						)}
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
						{specialTitleReward && (
							<div className={styles.rewardItem}>
								<div className={styles.rewardIcon}>
									<Icon name="badge-premium" size={20} color="var(--color-secondary)" />
								</div>
								<div>
									<strong>{t('badgeDetail.specialTitle')}</strong>
									<p className={styles.rewardDesc}>&quot;{specialTitleReward.special_title}&quot;</p>
								</div>
							</div>
						)}
						{!specialTitleReward && rewards.length === 0 && (
							<div className={styles.rewardItem}>
								<div className={styles.rewardIcon}>
									<Icon name="badge-premium" size={20} color="var(--color-secondary)" />
								</div>
								<div>
									<strong>{t('badgeDetail.specialTitle')}</strong>
									<p className={styles.rewardDesc}>
										&quot;{serviceLineName ? `Pioneiro ${serviceLineName} Softinsa` : 'Especialista Softinsa'}&quot;
									</p>
								</div>
							</div>
						)}
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
						{skills.length > 0
							? skills.map((s) => (
								<li key={s.skills_id} className={styles.competencyItem}>
									<Icon name="check_circle" size={18} color="var(--color-primary)" />
									{s.skill_name}
								</li>
							))
							: (
								<li className={styles.competencyItem}>
									<Icon name="check_circle" size={18} color="var(--color-primary)" />
									{serviceLineName || title}
								</li>
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
					{hasObtained && userAward.expiration_at && (
						<span className={styles.expirationBadge}>
							<Icon name="clock" size={18} color="var(--color-warning)" />
							{t('badgeDetail.expiresOn')}: {new Date(userAward.expiration_at).toLocaleDateString('pt-PT', {
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
									icon="requirement"
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
									isConsultant={user?.role === 'Consultant'}
								/>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
