import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, CONSULTANT } from '../../../routes/paths';
import { getBadgeBySlug, getBadges } from '../../../features/badges/api/badgesApi';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { startApplication, generateCertificate } from '../../../features/applications/api/applicationsApi';
import { trackInteraction } from '../../../features/gamification/api/gamificationApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import BadgeCard from '../../../components/BadgeCard/BadgeCard';
import RequirementCard from '../../../components/RequirementCard/RequirementCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import GdprConsentModal from '../../../components/GdprConsentModal/GdprConsentModal';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import { useUser } from '../../../hooks/userContext';
import styles from './BadgeDetail.module.css';

const SERVICE_LINES_LIMIT = 5;

// Consultant badge detail page: shows badge info, requirements, rewards, related badges, and apply/share actions
export default function BadgeDetail() {
	// Access the current authenticated user and their role
	const { user } = useUser();
	// Initialize translation and language utilities
	const { t, i18n } = useTranslation();
	// Read the badge slug from the URL params
	const { slug } = useParams();
	// Get the imperative navigation function for redirects
	const navigate = useNavigate();
	// Store the badge detail data
	const [badge, setBadge] = useState(null);
	// Store the badge's requirement list
	const [requirements, setRequirements] = useState([]);
	// Store the list of all service lines for the sidebar
	const [serviceLines, setServiceLines] = useState([]);
	// Store related badges for the carousel section
	const [relatedBadges, setRelatedBadges] = useState([]);
	// Track whether the page data is loading
	const [loading, setLoading] = useState(true);
	// Track whether an application is being started
	const [applying, setApplying] = useState(false);
	// Track whether a certificate is being downloaded
	const [downloading, setDownloading] = useState(false);
	// Non-fatal error shown inline by the certificate action (does not replace the page)
	const [certError, setCertError] = useState(null);
	// Store any error message from failed API calls
	const [error, setError] = useState(null);
	// Control visibility of the GDPR consent modal before sharing
	const [showConsent, setShowConsent] = useState(false);
	// Hold a ref to the related badges carousel DOM element for scrolling
	const carouselRef = useRef(null);

	// Catalog list lives at different paths per role: Consultants use /catalog,
	// while TM/SLL use the shared /badges board. Linking the wrong one 403s.
	const catalogPath = user?.role === 'Consultant' ? CONSULTANT.CATALOG : SHARED.BADGES;
	// Only Consultants apply for badges / set objectives / track their own progress.
	// TM, SLL and Admin view the badge as a catalogue entry (requirements only).
	const isConsultant = user?.role === 'Consultant';

	// Reload badge data whenever the slug URL parameter changes
	useEffect(() => {
		loadData();
	}, [slug]);

	// Fetch badge details, service lines, and related badges in parallel
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

			const related = await getBadges(serviceLineId ? { serviceLineId, limit: 8 } : { limit: 8 }).catch(() => []);

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

	// Start a new badge application and navigate to its detail page
	async function handleApply() {
		setApplying(true);
		try {
			const newApp = await startApplication(badge.badge_slug || badge.badgeSlug || slug);
			const appGuid = newApp.application_guid || newApp.applicationGuid;
			navigate(`${SHARED.APPLICATIONS}/${appGuid}`);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setApplying(false);
		}
	}

	// Generate and open the PDF certificate for the earned badge
	async function handleDownloadCertificate() {
		const appGuid = badge?.user_award?.application_guid || badge?.user_application?.application_guid;
		if (!appGuid) {
			setCertError(t('badgeDetail.certificateUnavailable'));
			return;
		}

		// Open the tab synchronously, still inside the click handler, so the browser
		// keeps it tied to the user gesture. Opening it AFTER the await (as before)
		// gets blocked by pop-up blockers — which is why the download silently stopped
		// working. We then point this tab at the certificate once it is ready.
		const certWindow = window.open('about:blank', '_blank');

		setCertError(null);
		setDownloading(true);
		try {
			const langMap = { 'pt-PT': 'pt', 'es-ES': 'es', 'en-GB': 'en' };
			const lang = langMap[i18n.language] || 'en';

			const result = await generateCertificate(appGuid, lang);
			if (result?.certificateUrl) {
				if (certWindow) certWindow.location = result.certificateUrl;
				else window.open(result.certificateUrl, '_blank', 'noopener,noreferrer');
			} else if (certWindow) {
				certWindow.close();
			}
		} catch (err) {
			if (certWindow) certWindow.close();
			setCertError(resolveErrorMessage(err));
		} finally {
			setDownloading(false);
		}
	}

	// Publishing/sharing a credential exposes personal data — gate behind RGPD consent.
	// Open the GDPR consent modal before proceeding with LinkedIn share
	function handleShareLinkedIn() {
		setShowConsent(true);
	}

	// Perform the LinkedIn share after the user has given GDPR consent
	function doShareLinkedIn() {
		const badgeTitle = badge.badge_title || badge.badgeTitle;
		const verificationLink = badge.user_award?.public_verification_link;

		const shareUrl = verificationLink
			? `${window.location.origin}/verify/${verificationLink}`
			: window.location.href;

		const shareText = t('badgeDetail.linkedInShareText', { badgeTitle, url: shareUrl });
		const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
		window.open(linkedInUrl, '_blank', 'noopener,noreferrer');

		// Record the share (fire-and-forget; feeds recommendations/analytics).
		const badgeId = badge.badge_id || badge.badgeId;
		if (badgeId) trackInteraction(badgeId, 'SHARE_LINKEDIN').catch(() => {});
	}

	// Scroll the related badges carousel left or right by a fixed amount
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
				<Link to={catalogPath}>{t('badgeDetail.backToCatalog')}</Link>
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
	const learningPathSlug = learningPath?.path_slug || learningPath?.pathSlug;
	const serviceLineSlug = serviceLine?.sl_slug || serviceLine?.slSlug;
	const area = badge.area || badge.areaInfo;
	const areaName = area?.area_name || area?.areaName;
	const areaSlug = area?.area_slug || area?.areaSlug;
	const stage = badge.progression_stage || badge.progressionStage;
	const stageCode = stage?.stage_code?.stage_code || stage?.stageCode?.stageCode;
	const stageTitle = stage?.stage_title || stage?.stageTitle;

	const skills = badge.skills || [];
	const rewards = badge.rewards || [];
	const userAward = badge.user_award;
	const hasObtained = !!userAward;

	const userApplication = badge.user_application;
	const appState = userApplication?.application_state;
	const appGuid = userApplication?.application_guid;
	const fulfilledReqIds = new Set(userApplication?.fulfilled_requirement_ids || []);
	const hasGoal = badge.has_goal === true;

	const isActiveApp = appState && !['Accepted', 'Rejected'].includes(appState);

	const specialTitleReward = rewards.find((r) => r.special_title);

	const completedCount = requirements.filter(
		(r) => fulfilledReqIds.has(r.requirement_id || r.requirementId)
	).length;

	const progressPercent = requirements.length > 0
		? Math.round((completedCount / requirements.length) * 100)
		: 0;

	const breadcrumbItems = [
		{ label: t('sidebar.consultant.home'), to: SHARED.HOME },
		...(learningPathName
			? [{ label: learningPathName, to: learningPathSlug ? SHARED.STRUCTURE_LP_DETAIL.replace(':slug', learningPathSlug) : undefined }]
			: []),
		...(serviceLineName
			? [{ label: serviceLineName, to: serviceLineSlug ? SHARED.STRUCTURE_SL_DETAIL.replace(':slug', serviceLineSlug) : undefined }]
			: []),
		{ label: title, active: true },
	];

	const limitedServiceLines = serviceLines.slice(0, SERVICE_LINES_LIMIT);

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav aria-label={t('shared.breadcrumb')} className={styles.breadcrumbNav}>
				<ol className={styles.breadcrumbList}>
					{breadcrumbItems.map((item, i) => {
						const isLast = item.active;
						return (
							<li key={i} className={styles.breadcrumbItem}>
								{isLast ? (
									<span className={styles.breadcrumbCurrent}>{item.label}</span>
								) : item.to ? (
									<Link to={item.to} className={styles.breadcrumbLink}>{item.label}</Link>
								) : (
									<span className={styles.breadcrumbLink}>{item.label}</span>
								)}
							</li>
						);
					})}
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
					{hasObtained && (
						<span className={styles.obtainedCorner} title={t('badgeDetail.complete')} aria-label={t('badgeDetail.complete')}>
							<Icon name="check_circle" size={20} color="#fff" aria-hidden="true" />
						</span>
					)}
				</div>

				<div className={styles.heroBody}>
					<h1 className={styles.heroTitle}>{title}</h1>
					<p className={styles.heroDescription}>
						{description ? <TranslatedText text={description} /> : t('badgeDetail.noDescription')}
					</p>

					<div className={styles.chipRow}>
						{points != null && (
							<span className={`${styles.chip} ${styles.chipPoints}`}>
								<Icon name="star-points" size={16} />
								+ {points} {t('badgeDetail.pointsLabel')}
							</span>
						)}
						{areaName && (
							<Link
								to={areaSlug ? SHARED.STRUCTURE_AREA_DETAIL.replace(':slug', areaSlug) : '#'}
								className={`${styles.chip} ${styles.chipArea}`}
							>
								<Icon name="area" size={16} />
								{areaName}
							</Link>
						)}
						{(stageCode || stageTitle) && (
							<span className={styles.chip}>
								<Icon name="evolution" size={16} />
								{stageTitle || stageCode}
								{stageCode && stageTitle ? ` (${stageCode})` : ''}
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
						{/* Application button: consultant only; hidden when obtained or rejected */}
						{isConsultant && !hasObtained && appState !== 'Rejected' && (
							isActiveApp ? (
								<Button
									className={styles.actionBtn}
									onClick={() => navigate(`${SHARED.APPLICATIONS}/${appGuid}`)}
								>
									<Icon name="paper" size={16} />
									{t('badgeDetail.seeApplication')}
								</Button>
							) : (
								<Button onClick={handleApply} loading={applying} className={styles.actionBtn}>
									<Icon name="send" size={16} />
									{t('badgeDetail.applyNow')}
								</Button>
							)
						)}

						{/* Objective button: consultant only; hidden when obtained */}
						{isConsultant && !hasObtained && (
							<Button
								variant="filled"
								className={styles.actionBtnObjective}
								onClick={() => navigate(CONSULTANT.OBJECTIVES)}
							>
								<Icon name="target" size={16} />
								{hasGoal ? t('badgeDetail.checkObjective') : t('badgeDetail.addObjective')}
							</Button>
						)}

						{/* LinkedIn + Download Certificate: only when obtained */}
						{hasObtained && (
							<>
								<Button variant="outlined" className={styles.actionBtnLinkedIn} onClick={handleShareLinkedIn}>
									<Icon name="linkedin" size={16} />
									{t('badgeDetail.shareLinkedIn')}
								</Button>
								<Button
									variant="outlined"
									className={styles.actionBtnCertificate}
									onClick={handleDownloadCertificate}
									loading={downloading}
								>
									<Icon name="download" size={16} />
									{t('badgeDetail.downloadCertificate')}
								</Button>
							</>
						)}

					</div>
					{certError && (
						<div className={`alert alert-danger mt-3 mb-0 ${styles.certError}`} role="alert">{certError}</div>
					)}
				</div>
			</section>

			{/* ── Section 2: Rewards ── */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('badgeDetail.rewards')}</h2>
				<p className={styles.sectionDesc}>{t('badgeDetail.rewardsDescription')}</p>

				<div className={styles.rewardsGrid}>
					<div className={styles.rewardsList}>
						<div className={`${styles.rewardItem} ${hasObtained ? styles.rewardObtained : ''}`}>
							<div className={`${styles.rewardIcon} ${hasObtained ? styles.rewardIconObtained : ''}`}>
								{hasObtained ? (
									<Icon name="check_circle" size={20} color="var(--color-success)" />
								) : (
									<Icon name="lock" size={20} color="var(--color-outline)" />
								)}
							</div>
							<div>
								<strong>{t('badgeDetail.certificatePdf')}</strong>
								<p className={styles.rewardDesc}>{t('badgeDetail.certificateDesc')}</p>
							</div>
						</div>
						{specialTitleReward && (
							<div className={`${styles.rewardItem} ${hasObtained ? styles.rewardObtained : ''}`}>
								<div className={`${styles.rewardIcon} ${hasObtained ? styles.rewardIconObtained : ''}`}>
									{hasObtained ? (
										<Icon name="check_circle" size={20} color="var(--color-success)" />
									) : (
										<Icon name="lock" size={20} color="var(--color-outline)" />
									)}
								</div>
								<div>
									<strong>{t('badgeDetail.specialTitle')}</strong>
									<p className={styles.rewardDesc}>&quot;{specialTitleReward.special_title}&quot;</p>
								</div>
							</div>
						)}
						{!specialTitleReward && rewards.length === 0 && (
							<div className={`${styles.rewardItem} ${hasObtained ? styles.rewardObtained : ''}`}>
								<div className={`${styles.rewardIcon} ${hasObtained ? styles.rewardIconObtained : ''}`}>
									{hasObtained ? (
										<Icon name="check_circle" size={20} color="var(--color-success)" />
									) : (
										<Icon name="lock" size={20} color="var(--color-outline)" />
									)}
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
									<Icon name="skills" size={18} color="var(--color-primary)" />
									<div className={styles.competencyText}>
										<span className={styles.competencyName}>{s.skill_name}</span>
										{(s.skill_description || s.skillDescription) && (
											<span className={styles.competencyDesc}>
												<TranslatedText text={s.skill_description || s.skillDescription} />
											</span>
										)}
									</div>
								</li>
							))
							: (
								<li className={styles.competencyItem}>
									<Icon name="skills" size={18} color="var(--color-primary)" />
									{serviceLineName || title}
								</li>
							)
						}
					</ul>
				</section>

				<aside className={styles.serviceLinesCard}>
					<h3 className={styles.serviceLineTitle}>{t('badgeDetail.exploreServiceLines')}</h3>
					<ul className={styles.serviceLineList}>
						{limitedServiceLines.map((sl) => (
							<li key={sl.service_line_id || sl.serviceLineId} className={styles.serviceLineItem}>
								<Link to={`/structure/service-lines/${sl.sl_slug || sl.slSlug}`} className={styles.serviceLineLink}>
									<Icon name="service-line" size={18} color="var(--color-outline)" />
									<span>{sl.service_line_name || sl.serviceLineName}</span>
									<Icon name="chevron_forward" size={16} color="var(--color-outline)" />
								</Link>
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
							<Icon name="evolution" size={18} color="var(--color-warning)" />
							{t('badgeDetail.expiresOn')}: {new Date(userAward.expiration_at).toLocaleDateString('pt-PT', {
								day: 'numeric', month: 'short', year: 'numeric'
							})}
						</span>
					)}
				</div>

				{/* Progress bar is the consultant's own completion; non-consultants
				    just see the requirements list below. */}
				{isConsultant && requirements.length > 0 && (
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
							const reqId = req.requirement_id || req.requirementId;
							const reqTitle = req.requirement_title || req.requirementTitle || t('badgeDetail.requirementN', { n: idx + 1 });
							const reqDesc = req.requirement_description || req.requirementDescription || '';
							const isFulfilled = fulfilledReqIds.has(reqId);
							return (
								<RequirementCard
									key={reqId || idx}
									title={reqTitle}
									description={reqDesc}
									status={isFulfilled ? 'complete' : 'pending'}
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

			{showConsent && (
				<GdprConsentModal
					policyType="Privacy"
					purpose={t('gdprConsent.shareBadgePurpose', { badge: title })}
					onConfirm={doShareLinkedIn}
					onClose={() => setShowConsent(false)}
				/>
			)}
		</div>
	);
}
