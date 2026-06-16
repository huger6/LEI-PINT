import { useState, useEffect, useMemo } from 'react';
import { useNavigate, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadges, deleteBadge, updateBadge } from '../../../features/badges/api/badgesApi';
import { getAreas } from '../../../features/badges/api/hierarchyApi';
import { ADMIN } from '../../../routes/paths';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './AdminBadges.module.css';

const idEq = (a, b) => a != null && b != null && String(a) === String(b);

export default function AdminBadges() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [badges, setBadges] = useState([]);
	const [areas, setAreas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [confirmTarget, setConfirmTarget] = useState(null);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState('');

	async function loadData() {
		try {
			setLoading(true);
			const [badgeData, areaData] = await Promise.all([getBadges(), getAreas()]);
			setBadges(badgeData.data || badgeData || []);
			setAreas(areaData.data || areaData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { loadData(); }, []);

	function getAreaName(areaId) {
		const area = areas.find((a) => idEq(a.area_id ?? a.areaId, areaId));
		return area ? (area.area_name || area.areaName) : '—';
	}

	async function doDeactivate() {
		if (!confirmTarget) return;
		const slug = confirmTarget.badge_slug || confirmTarget.badgeSlug;
		setBusy(true);
		setActionError('');
		try {
			await deleteBadge(slug);
			// Keep the badge in the list (inactive) so it can be reactivated.
			setBadges((prev) => prev.map((b) => (b.badge_slug === slug ? { ...b, is_active: false } : b)));
			setConfirmTarget(null);
		} catch (err) {
			const code = err?.response?.data?.code;
			if (code === 'BADGE_HAS_DEPENDENCIES') {
				const n = err.response.data?.data?.activeApplications;
				setActionError(t('adminBadges.hasDependencies', { count: n ?? 0 }));
			} else {
				setActionError(t('adminBadges.actionFailed'));
			}
		} finally {
			setBusy(false);
		}
	}

	async function handleReactivate(item) {
		const slug = item.badge_slug || item.badgeSlug;
		try {
			await updateBadge(slug, { isActive: true });
			setBadges((prev) => prev.map((b) => (b.badge_slug === slug ? { ...b, is_active: true } : b)));
		} catch (err) {
			console.error(err);
		}
	}

	const filteredBadges = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return badges;
		return badges.filter((b) => (b.badge_title || b.badgeTitle || '').toLowerCase().includes(term));
	}, [badges, search]);

	return (
		<div>
			<div className={styles.header}>
				<div className={styles.headerIcon}><Icon name="badge" size={24} aria-hidden="true" /></div>
				<div className={styles.headerText}>
					<h1 className={styles.title}>{t('adminBadges.title')}</h1>
					<p className={styles.subtitle}>{t('adminBadges.subtitle')}</p>
				</div>
				<Button onClick={() => navigate(ADMIN.BADGE_NEW)}>
					<Icon name="add" size={16} aria-hidden="true" className="me-1" />
					{t('adminBadges.newBadge')}
				</Button>
			</div>

			{!loading && badges.length > 0 && (
				<div className={styles.toolbar}>
					<FilterSearchInput
						name="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t('adminBadges.searchPlaceholder')}
						ariaLabel={t('adminBadges.searchPlaceholder')}
					/>
				</div>
			)}

			{loading ? (
				<CardGridSkeleton count={8} />
			) : badges.length === 0 ? (
				<div className={styles.empty}>
					<Icon name="badge" size={40} aria-hidden="true" className={styles.emptyIcon} />
					<h5 className="text-muted mb-0">{t('adminBadges.noBadges')}</h5>
					<p className="text-muted small">{t('adminBadges.noBadgesDesc')}</p>
				</div>
			) : (
				<div className={styles.grid}>
					{filteredBadges.map((b) => {
						const img = b.badge_img_url || b.badgeImgUrl;
						const title = b.badge_title || b.badgeTitle;
						const isSpecial = (b.badge_type || b.badgeType) === 'Special';
						const active = b.is_active;
						const slug = b.badge_slug || b.badgeSlug;
						const stageCode = b.progression_stage?.stage_code?.stage_code;
						return (
							<article key={slug} className={`${styles.card} ${!active ? styles.cardInactive : ''}`}>
								<div className={`${styles.imageWrap} ${isSpecial ? styles.imageSpecial : ''}`}>
									{img ? <img src={img} alt={title} className={styles.image} /> : <Icon name="badge" size={48} className={styles.imageFallback} aria-hidden="true" />}
									<span className={`${styles.typePill} ${isSpecial ? styles.typeSpecial : styles.typeStandard}`}>
										{isSpecial ? t('badgeCatalog.filters.class.special', { defaultValue: 'Special' }) : t('badgeCatalog.filters.class.standard', { defaultValue: 'Standard' })}
									</span>
									<span className={`${styles.statusPill} ${active ? styles.statusOn : styles.statusOff}`}>
										{active ? t('shared.active') : t('shared.inactive')}
									</span>
								</div>
								<div className={styles.content}>
									<h3 className={styles.cardTitle} title={title}>{title}</h3>
									<p className={styles.description}>{b.badge_description || b.badgeDescription || '—'}</p>
									<div className={styles.metaGrid}>
										<span className={styles.metaChip}>{getAreaName(b.area_id || b.areaId)}</span>
										{stageCode && <span className={styles.metaChip}>{stageCode}</span>}
										<span className={`${styles.metaChip} ${styles.points}`}>{b.badge_points || b.badgePoints || 0} pts</span>
									</div>
								</div>
								<div className={styles.cardActions}>
									<Button size="sm" variant="outlined" className="flex-fill" onClick={() => navigate(generatePath(ADMIN.BADGE_EDIT, { slug }))}>
										<Icon name="pencil" size={14} aria-hidden="true" className="me-1" /> {t('shared.edit')}
									</Button>
									{active ? (
										<Tooltip text={t('shared.deactivate')}>
											<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.deactivate')} onClick={() => { setActionError(''); setConfirmTarget(b); }}>
												<Icon name="trash" size={14} aria-hidden="true" />
											</Button>
										</Tooltip>
									) : (
										<Tooltip text={t('shared.reactivate')}>
											<Button size="sm" variant="outlined" color="success" aria-label={t('shared.reactivate')} onClick={() => handleReactivate(b)}>
												<Icon name="activate" size={14} aria-hidden="true" />
											</Button>
										</Tooltip>
									)}
								</div>
							</article>
						);
					})}
				</div>
			)}

			{confirmTarget && (
				<Modal
					title={t('shared.deactivate')}
					size="sm"
					onClose={() => !busy && setConfirmTarget(null)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setConfirmTarget(null)} disabled={busy}>{t('shared.cancel')}</Button>
							<Button color="danger" loading={busy} onClick={doDeactivate}>{t('shared.deactivate')}</Button>
						</>
					}
				>
					<p className="mb-2">{t('adminBadges.confirmDeactivate', { name: confirmTarget.badge_title || confirmTarget.badgeTitle })}</p>
					{actionError && <p className="small text-danger mb-0">{actionError}</p>}
				</Modal>
			)}
		</div>
	);
}
