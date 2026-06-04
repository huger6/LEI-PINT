import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
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
	const expirationDays = badge.expiration_duration_days ?? badge.expirationDurationDays;

	const areaName = badge.area?.area_name || badge.area?.areaName;
	const serviceLineName = badge.service_line?.service_line_name || badge.serviceLine?.serviceLineName;
	const learningPathName = badge.learning_path?.path_title || badge.learningPath?.pathTitle;
	const stageCode = badge.progression_stage?.stage_code?.stage_code || badge.progressionStage?.stageCode?.stageCode;
	const stageTitle = badge.progression_stage?.stage_title || badge.progressionStage?.stageTitle;

	const badgeClass = getBadgeClassLabel(badgeType);
	const isSpecial = badgeClass.toLowerCase() === 'special';

	return (
		<Link to={to} className={`text-decoration-none ${styles.link}`}>
			<article className={styles.card}>
				<div className={styles.imageWrap}>
					{imageUrl ? (
						<img src={imageUrl} alt={title} className={styles.image} />
					) : (
						<Icon name="badge" size={56} className={styles.imageFallback} aria-hidden="true" />
					)}
					<span className={`${styles.typePill} ${isSpecial ? styles.special : styles.standard}`}>
						{badgeClass}
					</span>
					{onToggleFavorite && (
						<button
							type="button"
							className={`${styles.bookmarkBtn} ${isFavorited ? styles.bookmarkActive : ''}`}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onToggleFavorite(badge);
							}}
							aria-label={isFavorited ? t('badgeCatalog.removeSaved') : t('badgeCatalog.saveBadge')}
							title={isFavorited ? t('badgeCatalog.removeSaved') : t('badgeCatalog.saveBadge')}
						>
							<Icon name={isFavorited ? 'bookmark-filled' : 'bookmark'} size={18} aria-hidden="true" />
						</button>
					)}
				</div>

				<div className={styles.content}>
					<h3 className={styles.title}>{title}</h3>
					<p className={styles.description}>{description || 'No description available.'}</p>

					<div className={styles.metaGrid}>
						{learningPathName && <span className={styles.metaChip}>{learningPathName}</span>}
						{serviceLineName && <span className={styles.metaChip}>{serviceLineName}</span>}
						{areaName && <span className={styles.metaChip}>{areaName}</span>}
						{stageCode && <span className={styles.metaChip}>{stageCode}{stageTitle ? ` - ${stageTitle}` : ''}</span>}
					</div>
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
