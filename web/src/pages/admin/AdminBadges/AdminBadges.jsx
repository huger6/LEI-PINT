import { useState, useEffect, useCallback } from 'react';
import { useNavigate, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadgesCatalog, deleteBadge, updateBadge } from '../../../features/badges/api/badgesApi';
import { getAreas, getServiceLines, getLearningPaths } from '../../../features/badges/api/hierarchyApi';
import { ADMIN } from '../../../routes/paths';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../components/Pagination/Pagination';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import AdminBadgeFilters, { EMPTY_FILTERS, MAX_POINTS } from './AdminBadgeFilters/AdminBadgeFilters';
import styles from './AdminBadges.module.css';

const PAGE_SIZE = 12;
const idEq = (a, b) => a != null && b != null && String(a) === String(b);

export default function AdminBadges() {
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Access the router navigation function.
	const navigate = useNavigate();
	// Store the current page of badge results.
	const [badges, setBadges] = useState([]);
	// Store pagination metadata from the API response.
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	// Track the current page number for pagination.
	const [page, setPage] = useState(1);
	// Store all areas for filter options.
	const [areas, setAreas] = useState([]);
	// Store all service lines for filter options.
	const [serviceLines, setServiceLines] = useState([]);
	// Store all learning paths for filter options.
	const [learningPaths, setLearningPaths] = useState([]);
	// Hold the currently active filter values.
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	// Control visibility of the filter sidebar.
	const [showFilters, setShowFilters] = useState(false);
	// Track whether badge data is loading.
	const [loading, setLoading] = useState(true);
	// Hold the badge targeted for deactivation confirmation.
	const [confirmTarget, setConfirmTarget] = useState(null);
	// Track whether a deactivation or reactivation action is in progress.
	const [busy, setBusy] = useState(false);
	// Store any action error message to display in the confirm modal.
	const [actionError, setActionError] = useState('');

	// Filter option sources (loaded once).
	useEffect(() => {
		let active = true;
		(async () => {
			const [ars, sls, lps] = await Promise.all([
				getAreas({ limit: 100 }).catch(() => []),
				getServiceLines({ limit: 100 }).catch(() => []),
				getLearningPaths({ limit: 100 }).catch(() => []),
			]);
			if (!active) return;
			setAreas(ars || []);
			setServiceLines(sls || []);
			setLearningPaths(lps || []);
		})();
		return () => { active = false; };
	}, []);

	// Fetch a page of badges applying current filters, memoized to avoid stale closure.
	const loadBadges = useCallback(async () => {
		setLoading(true);
		try {
			const params = { page, limit: PAGE_SIZE };
			if (filters.search.trim()) params.search = filters.search.trim();
			if (filters.learningPathId) params.learningPathId = Number(filters.learningPathId);
			if (filters.serviceLineId) params.serviceLineId = Number(filters.serviceLineId);
			if (filters.areaId) params.areaId = Number(filters.areaId);
			if (filters.stageCodes.length > 0) params.stageCodes = filters.stageCodes.join(',');
			if (filters.badgeClass !== 'all') params.badgeClass = filters.badgeClass;
			if (Number(filters.minPoints) > 0) params.minPoints = Number(filters.minPoints);
			if (Number(filters.maxPoints) < MAX_POINTS) params.maxPoints = Number(filters.maxPoints);
			if (filters.expiringOnly) params.expiringOnly = true;

			const { data, pagination: pag } = await getBadgesCatalog(params);
			setBadges(data || []);
			setPagination(pag || { totalItems: 0, totalPages: 0, currentPage: 1 });
		} catch (err) {
			console.error(err);
			setBadges([]);
		} finally {
			setLoading(false);
		}
	}, [page, filters]);

	// Reload badges whenever the page or filters change.
	useEffect(() => { loadBadges(); }, [loadBadges]);

	// Apply a partial patch to the active filters and reset to page 1.
	function patchFilters(patch) {
		setFilters((prev) => ({ ...prev, ...patch }));
		setPage(1);
	}

	// Clear all active filters and reset to page 1.
	function clearFilters() {
		setFilters(EMPTY_FILTERS);
		setPage(1);
	}

	// Resolve an area's display name by its ID.
	function getAreaName(areaId) {
		const area = areas.find((a) => idEq(a.area_id ?? a.areaId, areaId));
		return area ? (area.area_name || area.areaName) : '—';
	}

	// Deactivate the badge currently set as the confirmation target.
	async function doDeactivate() {
		if (!confirmTarget) return;
		const slug = confirmTarget.badge_slug || confirmTarget.badgeSlug;
		setBusy(true);
		setActionError('');
		try {
			await deleteBadge(slug);
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

	// Reactivate an inactive badge by its slug.
	async function handleReactivate(item) {
		const slug = item.badge_slug || item.badgeSlug;
		try {
			await updateBadge(slug, { isActive: true });
			setBadges((prev) => prev.map((b) => (b.badge_slug === slug ? { ...b, is_active: true } : b)));
		} catch (err) {
			console.error(err);
		}
	}

	const hasActiveFilters = Boolean(filters.search.trim()) || Boolean(filters.learningPathId)
		|| Boolean(filters.serviceLineId) || Boolean(filters.areaId) || filters.stageCodes.length > 0
		|| filters.badgeClass !== 'all' || Number(filters.minPoints) > 0
		|| Number(filters.maxPoints) < MAX_POINTS || filters.expiringOnly;

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

			<div className={styles.toolbar}>
				<div className={styles.searchWrap}>
					<FilterSearchInput
						name="search"
						value={filters.search}
						onChange={(e) => patchFilters({ search: e.target.value })}
						placeholder={t('adminBadges.searchPlaceholder')}
						ariaLabel={t('adminBadges.searchPlaceholder')}
					/>
				</div>
				<Button variant="text" color="primary" size="sm" onClick={() => setShowFilters((v) => !v)}>
					<Icon name="filter" size={16} /> {t('badgeCatalog.filters.title', { defaultValue: 'Filtros' })}
				</Button>
				{hasActiveFilters && (
					<Button variant="text" color="primary" size="sm" onClick={clearFilters}>
						{t('badgeCatalog.filters.clear')}
					</Button>
				)}
			</div>

			<div className="row g-4">
				<aside className={`col-12 col-lg-3 ${showFilters ? '' : 'd-none d-lg-block'}`}>
					<AdminBadgeFilters
						filters={filters}
						onChange={patchFilters}
						learningPaths={learningPaths}
						serviceLines={serviceLines}
						areas={areas}
					/>
				</aside>

				<section className="col-12 col-lg-9">
					{loading ? (
						<CardGridSkeleton count={6} columns={3} />
					) : badges.length === 0 ? (
						<div className={styles.empty}>
							<Icon name="badge" size={40} aria-hidden="true" className={styles.emptyIcon} />
							<h5 className="text-muted mb-0">{t('adminBadges.noBadges')}</h5>
							<p className="text-muted small">{hasActiveFilters ? t('badgeCatalog.noBadgesDesc') : t('adminBadges.noBadgesDesc')}</p>
						</div>
					) : (
						<>
							<div className={styles.grid}>
								{badges.map((b) => {
									const img = b.badge_img_url || b.badgeImgUrl;
									const title = b.badge_title || b.badgeTitle;
									const isSpecial = (b.badge_type || b.badgeType) === 'Special';
									const active = b.is_active;
									const slug = b.badge_slug || b.badgeSlug;
									const stageCode = b.progression_stage?.stage_code?.stage_code;
									// Navigate to the badge detail page when the card is clicked.
									const openBadge = () => navigate(`/badges/${slug}`);
									return (
										<article
											key={slug}
											className={`${styles.card} ${styles.cardClickable} ${!active ? styles.cardInactive : ''}`}
											role="button"
											tabIndex={0}
											onClick={openBadge}
											onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBadge(); } }}
										>
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
												<p className={styles.description}><TranslatedText text={b.badge_description || b.badgeDescription || '—'} /></p>
												<div className={styles.metaGrid}>
													<span className={styles.metaChip}>{b.area?.area_name || getAreaName(b.area_id || b.areaId)}</span>
													{stageCode && <span className={styles.metaChip}>{stageCode}</span>}
													<span className={`${styles.metaChip} ${styles.points}`}>{b.badge_points || b.badgePoints || 0} pts</span>
												</div>
											</div>
											<div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
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

							<div className="mt-4">
								<Pagination
									currentPage={pagination.currentPage}
									totalPages={pagination.totalPages || 0}
									totalItems={pagination.totalItems || 0}
									itemCount={badges.length}
									onPageChange={setPage}
								/>
							</div>
						</>
					)}
				</section>
			</div>

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
