import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import Tooltip from '../Tooltip/Tooltip';
import styles from './BadgeCard.module.css';

function getBadgeClassLabel(rawType) {
	const normalized = String(rawType || '').trim().toLowerCase();
	if (normalized === 'standard') return 'Standard';
	if (normalized === 'special') return 'Special';
	return rawType || 'Standard';
}

export default function BadgeCard({ badge, to, isConsultant = true, isFavorited = false, onToggleFavorite }) {
	const { t } = useTranslation();

	const title = badge.badge_title || badge.badgeTitle;
	const description = badge.badge_description || badge.badgeDescription || '';
	const imageUrl = badge.badge_img_url || badge.badgeImgUrl;
	const points = badge.badge_points ?? badge.badgePoints ?? 0;
	const badgeType = badge.badge_type || badge.badgeType;
	const consultantCount = Number(badge.consultant_count || badge.consultantCount || 0);

	const areaName = badge.area?.area_name || badge.area?.areaName;
	const stageCode = badge.progression_stage?.stage_code?.stage_code || badge.progressionStage?.stageCode?.stageCode;
	const stageTitle = badge.progression_stage?.stage_title || badge.progressionStage?.stageTitle;

	const requirements = badge.badge_requirements || badge.badgeRequirements || [];
	const hasObtained = badge.has_obtained === true || badge.has_obtained === 'true';

	const badgeClass = getBadgeClassLabel(badgeType);
	const isSpecial = badgeClass.toLowerCase() === 'special';

	// Special badges are distinguished only by their title/label pill — no
	// decorative frame, glow or animation (rewards rule).
	const linkClasses = [
		'text-decoration-none',
		styles.link,
	].filter(Boolean).join(' ');

	const cardClasses = [
		styles.card,
		hasObtained ? styles.obtainedCard : '',
	].filter(Boolean).join(' ');

	return (
		<Link to={to} className={linkClasses}>
			<article className={cardClasses}>
				<div className={styles.imageWrap}>
					{imageUrl ? (
						<img src={imageUrl} alt={title} className={styles.image} />
					) : (
						<Icon name="badge" size={56} className={styles.imageFallback} aria-hidden="true" />
					)}
					<span className={`${styles.typePill} ${isSpecial ? styles.special : styles.standard}`}>
						{isSpecial && <Icon name="badge-premium" size={13} aria-hidden="true" />}
						{t(`badgeCatalog.filters.class.${isSpecial ? 'special' : 'standard'}`, { defaultValue: badgeClass })}
					</span>
					<span className={styles.topLeftIcons}>
						{hasObtained && (
							<Tooltip text={t('badgeCatalog.obtained.true')}>
								<span className={styles.obtainedIcon} aria-label={t('badgeCatalog.obtained.true')}>
									<Icon name="check_circle" size={18} aria-hidden="true" />
								</span>
							</Tooltip>
						)}
						{onToggleFavorite && (
							<Tooltip text={isFavorited ? t('badgeCatalog.removeSaved') : t('badgeCatalog.saveBadge')}>
								<button
									type="button"
									className={`${styles.bookmarkBtn} ${isFavorited ? styles.bookmarkActive : ''}`}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										onToggleFavorite(badge);
									}}
									aria-label={isFavorited ? t('badgeCatalog.removeSaved') : t('badgeCatalog.saveBadge')}
								>
									<Icon name={isFavorited ? 'bookmark-filled' : 'bookmark'} size={18} aria-hidden="true" />
								</button>
							</Tooltip>
						)}
					</span>
				</div>

				<div className={styles.content}>
					<h3 className={styles.title}>{title}</h3>
					<p className={styles.description}>{description || 'No description available.'}</p>

					<div className={styles.metaGrid}>
						{areaName && <span className={styles.metaChip}>{areaName}</span>}
						{stageCode && <span className={styles.metaChip}>{stageCode}{stageTitle ? ` - ${stageTitle}` : ''}</span>}
					</div>

					{requirements.length > 0 && (
						<div className={styles.requirementsSection}>
							<span className={styles.requirementsLabel}>
								{t('badgeDetail.requirements')}
							</span>
							<div className={styles.requirementsRow}>
								{requirements.map((req) => {
									const reqTitle = req.requirement_title || req.requirementTitle;
									const reqDesc = req.requirement_description || req.requirementDescription || '';
									return (
										<span
											key={req.requirement_id || req.requirementId}
											className={`${styles.requirementIcon} ${hasObtained ? styles.requirementObtained : ''}`}
											aria-label={reqTitle}
										>
											<Icon name={hasObtained ? 'check_circle' : 'requirement'} size={13} aria-hidden="true" />
											<span className={styles.requirementTooltip}>
												<strong className={styles.requirementTooltipTitle}>{reqTitle}</strong>
												{reqDesc}
											</span>
										</span>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<div className={styles.footer}>
					<div className={styles.metrics}>
						{isConsultant && (
							<span className={styles.metric}>
								<Icon name="star" size={14} aria-hidden="true" />
								{points} pts
							</span>
						)}
						{!isConsultant && consultantCount > 0 && (
							<span className={styles.metric}>
								<Icon name="user" size={14} aria-hidden="true" />
								{consultantCount}
							</span>
						)}
					</div>
					<span className={styles.viewHint}>
						View
						<Icon name="chevron_forward" size={14} aria-hidden="true" />
					</span>
				</div>
			</article>
		</Link>
	);
}
