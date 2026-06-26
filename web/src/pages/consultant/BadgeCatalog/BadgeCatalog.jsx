import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BadgeCard from '../../../components/BadgeCard/BadgeCard';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import Pagination from '../../../components/Pagination/Pagination';
import { getBadgesCatalog } from '../../../features/badges/api/badgesApi';
import { getAreas, getLearningPaths, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { getFavorites, toggleFavorite } from '../../../features/gamification/api/gamificationApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import styles from './BadgeCatalog.module.css';

const PAGE_SIZE = 12;
const MAX_POINTS = 5000;

const PROGRESSION_TIERS = [
	{ code: 'A', labelKey: 'badgeCatalog.filters.tiers.A' },
	{ code: 'B', labelKey: 'badgeCatalog.filters.tiers.B' },
	{ code: 'C', labelKey: 'badgeCatalog.filters.tiers.C' },
	{ code: 'D', labelKey: 'badgeCatalog.filters.tiers.D' },
	{ code: 'E', labelKey: 'badgeCatalog.filters.tiers.E' },
];

const EMPTY_FILTERS = {
	search: '',
	learningPathId: '',
	serviceLineId: '',
	areaId: '',
	stageCodes: [],
	badgeClass: 'all',
	minPoints: 0,
	maxPoints: MAX_POINTS,
	expiringOnly: false,
	obtained: 'all',
};

// Clamp a numeric filter value to the valid 0–MAX_POINTS range
function normalizeNumericInput(value) {
	if (value === '' || value === null || value === undefined) return 0;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 0;
	return Math.min(MAX_POINTS, Math.max(0, parsed));
}

// Ensure minPoints never exceeds maxPoints in the filter object
function normalizeFilters(filters) {
	const minPoints = normalizeNumericInput(filters.minPoints);
	const maxPoints = normalizeNumericInput(filters.maxPoints);
	return {
		...filters,
		minPoints: Math.min(minPoints, maxPoints),
		maxPoints: Math.max(minPoints, maxPoints),
	};
}

// Consultant page listing the filterable, paginated badge catalog with desktop and mobile filters
export default function BadgeCatalog() {
	// Initialize translation utility
	const { t } = useTranslation();
	// Access the current authenticated user
	const { user } = useUser();
	// Read URL search parameters for deep-linking
	const [searchParams] = useSearchParams();

	// Track whether the initial filter options are loading
	const [loadingPage, setLoadingPage] = useState(true);
	// Track whether a badge list fetch is in progress
	const [loadingBadges, setLoadingBadges] = useState(false);
	// Store any error message from failed fetches
	const [error, setError] = useState(null);
	// Store the current page of badge results
	const [badges, setBadges] = useState([]);
	// Store pagination metadata from the API response
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	// Track the currently active page number
	const [currentPage, setCurrentPage] = useState(1);

	// Store available learning path options for the filter
	const [learningPaths, setLearningPaths] = useState([]);
	// Store available service line options for the filter
	const [serviceLines, setServiceLines] = useState([]);
	// Store available area options for the filter
	const [areas, setAreas] = useState([]);

	// Store the currently applied filter state
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	// Store the draft filter state while the mobile drawer is open
	const [mobileDraftFilters, setMobileDraftFilters] = useState(EMPTY_FILTERS);
	// Control whether the mobile filter drawer is open
	const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
	// Track whether the default area pre-filter has been applied
	const [defaultAreaApplied, setDefaultAreaApplied] = useState(false);

	// Store the set of badge slugs the user has favourited
	const [favoriteSlugs, setFavoriteSlugs] = useState(new Set());
	// Track whether the catalog is showing only saved/favourited badges
	const [showingSaved, setShowingSaved] = useState(false);

	// Load learning paths, service lines, and areas for the filter dropdowns on mount
	useEffect(() => {
		let ignore = false;

		async function loadFilterOptions() {
			try {
				setLoadingPage(true);
				const [lpRows, slRows, areaRows] = await Promise.all([
					getLearningPaths({ limit: 100 }),
					getServiceLines({ limit: 100 }),
					getAreas({ limit: 100 }),
				]);

				if (ignore) return;
				setLearningPaths(lpRows || []);
				setServiceLines(slRows || []);
				setAreas(areaRows || []);
			} catch (err) {
				if (ignore) return;
				setError(resolveErrorMessage(err));
			} finally {
				if (!ignore) setLoadingPage(false);
			}
		}

		loadFilterOptions();
		return () => { ignore = true; };
	}, []);

	// Load the consultant's favourite badge slugs when the user role is known
	useEffect(() => {
		if (user?.role !== 'Consultant') return;
		let ignore = false;

		async function loadFavorites() {
			try {
				const rows = await getFavorites();
				if (ignore) return;
				const slugs = new Set(rows.map((r) => r.badge?.badge_slug).filter(Boolean));
				setFavoriteSlugs(slugs);
			} catch {
				/* silent — favorites are non-critical */
			}
		}

		loadFavorites();
		return () => { ignore = true; };
	}, [user?.role]);

	// Toggle a badge's favourite status with optimistic UI update
	const handleToggleFavorite = useCallback(async (badge) => {
		const slug = badge.badge_slug || badge.badgeSlug;
		if (!slug) return;

		const wasFavorited = favoriteSlugs.has(slug);
		setFavoriteSlugs((prev) => {
			const next = new Set(prev);
			if (wasFavorited) next.delete(slug);
			else next.add(slug);
			return next;
		});

		try {
			const result = await toggleFavorite(slug);
			setFavoriteSlugs((prev) => {
				const next = new Set(prev);
				if (result.favorited) next.add(slug);
				else next.delete(slug);
				return next;
			});
		} catch {
			setFavoriteSlugs((prev) => {
				const next = new Set(prev);
				if (wasFavorited) next.add(slug);
				else next.delete(slug);
				return next;
			});
		}
	}, [favoriteSlugs]);

	// Build a lookup map from service line ID to service line object
	const serviceLineById = useMemo(() => {
		const map = new Map();
		serviceLines.forEach((sl) => {
			const id = sl.service_line_id || sl.serviceLineId;
			if (!id) return;
			map.set(id, sl);
		});
		return map;
	}, [serviceLines]);

	// Apply the default area filter from URL params or the user's primary area once data is ready
	useEffect(() => {
		if (defaultAreaApplied || areas.length === 0 || serviceLines.length === 0) return;

		// Deep-link from the dashboard: ?area=<slug> or ?sl=<slug> scopes the
		// catalog to that area / service line, overriding the primary-area default.
		const urlAreaSlug = searchParams.get('area');
		const urlSlSlug = searchParams.get('sl');
		if (urlAreaSlug || urlSlSlug) {
			const urlArea = urlAreaSlug ? areas.find((a) => (a.area_slug || a.areaSlug) === urlAreaSlug) : null;
			const urlSl = urlSlSlug ? serviceLines.find((s) => (s.sl_slug || s.slSlug) === urlSlSlug) : null;
			const slId = (urlArea?.service_line_id || urlArea?.serviceLineId) || (urlSl?.service_line_id || urlSl?.serviceLineId) || '';
			const lpId = slId
				? (serviceLineById.get(slId)?.learning_path_id || serviceLineById.get(slId)?.learningPathId || '')
				: '';
			const urlFilters = normalizeFilters({
				...EMPTY_FILTERS,
				learningPathId: lpId,
				serviceLineId: slId,
				areaId: urlArea ? (urlArea.area_id || urlArea.areaId) : '',
			});
			setFilters(urlFilters);
			setMobileDraftFilters(urlFilters);
			setDefaultAreaApplied(true);
			return;
		}

		const primaryAreaSlug = user?.areas?.find((area) => area.isPrimary)?.slug;
		if (!primaryAreaSlug) {
			setDefaultAreaApplied(true);
			return;
		}

		const primaryArea = areas.find((area) => (area.area_slug || area.areaSlug) === primaryAreaSlug);
		if (!primaryArea) {
			setDefaultAreaApplied(true);
			return;
		}

		const areaId = primaryArea.area_id || primaryArea.areaId;
		const serviceLineId = primaryArea.service_line_id || primaryArea.serviceLineId || '';
		const learningPathId = serviceLineId
			? (serviceLineById.get(serviceLineId)?.learning_path_id || serviceLineById.get(serviceLineId)?.learningPathId || '')
			: '';

		const defaultFilters = normalizeFilters({
			...EMPTY_FILTERS,
			learningPathId,
			serviceLineId,
			areaId
		});

		setFilters(defaultFilters);
		setMobileDraftFilters(defaultFilters);
		setDefaultAreaApplied(true);
	}, [areas, defaultAreaApplied, serviceLineById, serviceLines, user, searchParams]);

	// Fetch the badge list whenever the current page or active filters change
	useEffect(() => {
		let ignore = false;

		async function loadBadges() {
			try {
				setLoadingBadges(true);
				setError(null);

				const params = {
					page: currentPage,
					limit: PAGE_SIZE,
				};

				if (filters.search?.trim()) params.search = filters.search.trim();
				if (filters.learningPathId) params.learningPathId = Number(filters.learningPathId);
				if (filters.serviceLineId) params.serviceLineId = Number(filters.serviceLineId);
				if (filters.areaId) params.areaId = Number(filters.areaId);
				if (filters.stageCodes.length > 0) params.stageCodes = filters.stageCodes.join(',');
				if (filters.badgeClass && filters.badgeClass !== 'all') params.badgeClass = filters.badgeClass;
				if (Number(filters.minPoints) > 0) params.minPoints = Number(filters.minPoints);
				if (Number(filters.maxPoints) < MAX_POINTS) params.maxPoints = Number(filters.maxPoints);
				if (filters.expiringOnly) params.expiringOnly = true;
				if (filters.obtained && filters.obtained !== 'all') params.obtained = filters.obtained;

				const response = await getBadgesCatalog(params);

				if (ignore) return;
				setBadges(response.data || []);
				setPagination(response.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 });
			} catch (err) {
				if (ignore) return;
				setError(resolveErrorMessage(err));
			} finally {
				if (!ignore) setLoadingBadges(false);
			}
		}

		loadBadges();
		return () => { ignore = true; };
	}, [currentPage, filters]);

	// Attach Escape key listener and body scroll lock when the filter drawer is open
	useEffect(() => {
		if (!isFilterDrawerOpen) return undefined;

		const closeOnEscape = (event) => {
			if (event.key === 'Escape') setIsFilterDrawerOpen(false);
		};

		window.addEventListener('keydown', closeOnEscape);
		document.body.classList.add(styles.noScrollBody);

		return () => {
			window.removeEventListener('keydown', closeOnEscape);
			document.body.classList.remove(styles.noScrollBody);
		};
	}, [isFilterDrawerOpen]);

	// Apply a filter update and reset pagination to page 1
	function updateFilters(updater) {
		setFilters((prev) => {
			const next = normalizeFilters(typeof updater === 'function' ? updater(prev) : updater);
			return next;
		});
		setCurrentPage(1);
	}

	// Update the desktop search text filter
	function handleDesktopSearchChange(value) {
		updateFilters((prev) => ({ ...prev, search: value }));
	}

	// Update the desktop learning path filter and clear dependent filters
	function handleDesktopLearningPathChange(value) {
		updateFilters((prev) => ({
			...prev,
			learningPathId: value,
			serviceLineId: '',
			areaId: ''
		}));
	}

	// Update the desktop service line filter and clear the area filter
	function handleDesktopServiceLineChange(value) {
		updateFilters((prev) => ({
			...prev,
			serviceLineId: value,
			areaId: ''
		}));
	}

	// Toggle the desktop area filter on or off
	function handleDesktopAreaChange(areaId) {
		updateFilters((prev) => ({ ...prev, areaId: String(areaId) === String(prev.areaId) ? '' : areaId }));
	}

	// Toggle a progression tier in the desktop stage code filter list
	function handleDesktopTierToggle(code) {
		updateFilters((prev) => ({
			...prev,
			stageCodes: prev.stageCodes.includes(code)
				? prev.stageCodes.filter((current) => current !== code)
				: [...prev.stageCodes, code]
		}));
	}

	// Update the desktop badge class (all/standard/special) filter
	function handleDesktopBadgeClassChange(value) {
		updateFilters((prev) => ({ ...prev, badgeClass: value }));
	}

	// Update a points range endpoint (min or max) and enforce valid ordering
	function handleDesktopPointsChange(field, value) {
		const nextValue = normalizeNumericInput(value);
		updateFilters((prev) => {
			if (field === 'minPoints') {
				return {
					...prev,
					minPoints: nextValue,
					maxPoints: Math.max(nextValue, normalizeNumericInput(prev.maxPoints)),
				};
			}
			return {
				...prev,
				maxPoints: nextValue,
				minPoints: Math.min(nextValue, normalizeNumericInput(prev.minPoints)),
			};
		});
	}

	// Toggle the desktop "expiring soon only" filter
	function handleDesktopExpiringToggle(checked) {
		updateFilters((prev) => ({ ...prev, expiringOnly: checked }));
	}

	// Update the desktop obtained status filter
	function handleDesktopObtainedChange(value) {
		updateFilters((prev) => ({ ...prev, obtained: value }));
	}

	// Reset all desktop filters to their default empty state
	function resetDesktopFilters() {
		updateFilters(EMPTY_FILTERS);
	}

	// Copy current filters to the mobile draft and open the filter drawer
	function openDrawer() {
		setMobileDraftFilters(filters);
		setIsFilterDrawerOpen(true);
	}

	// Apply the mobile draft filters as the active filters and close the drawer
	function applyMobileFilters() {
		const nextFilters = normalizeFilters(mobileDraftFilters);
		setFilters(nextFilters);
		setCurrentPage(1);
		setIsFilterDrawerOpen(false);
	}

	// Update a field in the mobile draft filters without affecting the active filters
	function updateMobileFilters(updater) {
		setMobileDraftFilters((prev) => normalizeFilters(typeof updater === 'function' ? updater(prev) : updater));
	}

	// Reset the mobile draft filters to the empty state
	function resetMobileFilters() {
		setMobileDraftFilters(EMPTY_FILTERS);
	}

	if (loadingPage && badges.length === 0) {
		return (
			<>
				<div className="d-flex align-items-center justify-content-between mb-3">
					<h1 className="h3 mb-0">{t('badgeCatalog.title')}</h1>
				</div>
				<div className="row g-4">
					<aside className="col-xl-3 d-none d-xl-block" />
					<section className="col-12 col-xl-9">
						<CardGridSkeleton count={6} columns={3} />
					</section>
				</div>
			</>
		);
	}

	if (error && badges.length === 0) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{error}
			</div>
		);
	}

	const hasActiveFilters =
		Boolean(filters.search.trim()) ||
		Boolean(filters.learningPathId) ||
		Boolean(filters.serviceLineId) ||
		Boolean(filters.areaId) ||
		filters.stageCodes.length > 0 ||
		filters.badgeClass !== 'all' ||
		Number(filters.minPoints) > 0 ||
		Number(filters.maxPoints) < MAX_POINTS ||
		filters.expiringOnly ||
		(filters.obtained && filters.obtained !== 'all');

	const displayedBadges = showingSaved
		? badges.filter((b) => favoriteSlugs.has(b.badge_slug || b.badgeSlug))
		: badges;

	// Render the shared filter group sections for both desktop sidebar and mobile drawer
	function renderFilterGroups(state, handlers, keyPrefix = 'desktop') {
		const scopedServiceLines = state.learningPathId
			? serviceLines.filter((sl) => String(sl.learning_path_id || sl.learningPathId) === String(state.learningPathId))
			: [];
		const scopedAreas = state.serviceLineId
			? areas.filter((area) => String(area.service_line_id || area.serviceLineId) === String(state.serviceLineId))
			: [];
		const minPointsValue = normalizeNumericInput(state.minPoints);
		const maxPointsValue = normalizeNumericInput(state.maxPoints);
		const learningPathOptions = [
			{ value: '', label: t('badgeCatalog.filters.allLearningPaths') },
			...learningPaths.map((lp) => ({
				value: String(lp.learning_path_id || lp.learningPathId),
				label: lp.path_title || lp.pathTitle,
			})),
		];
		const serviceLineOptions = [
			{ value: '', label: t('badgeCatalog.filters.allServiceLines') },
			...scopedServiceLines.map((sl) => ({
				value: String(sl.service_line_id || sl.serviceLineId),
				label: sl.service_line_name || sl.serviceLineName,
			})),
		];

		return (
			<div className={`d-flex flex-column gap-4 ${styles.filtersContent}`}>
				<section>
					<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.structure')}</h3>
					<div className={`d-flex flex-column gap-2 ${styles.fieldStack}`}>
						<label className={styles.inputLabel} htmlFor={`${keyPrefix}-learning-path`}>
							{t('badgeCatalog.filters.learningPath')}
						</label>
						<CustomSelect
							id={`${keyPrefix}-learning-path`}
							name={`${keyPrefix}-learning-path`}
							value={String(state.learningPathId)}
							onChange={(event) => handlers.onLearningPathChange(event.target.value)}
							options={learningPathOptions}
							placeholder={t('badgeCatalog.filters.allLearningPaths')}
							ariaLabel={t('badgeCatalog.filters.learningPath')}
						/>

						<label className={styles.inputLabel} htmlFor={`${keyPrefix}-service-line`}>
							{t('badgeCatalog.filters.serviceLine')}
						</label>
						<CustomSelect
							id={`${keyPrefix}-service-line`}
							name={`${keyPrefix}-service-line`}
							value={String(state.serviceLineId)}
							onChange={(event) => handlers.onServiceLineChange(event.target.value)}
							options={serviceLineOptions}
							placeholder={t('badgeCatalog.filters.allServiceLines')}
							ariaLabel={t('badgeCatalog.filters.serviceLine')}
							disabled={!state.learningPathId}
						/>

						<div className={styles.areaPickerWrap}>
							<div className={styles.areaPickerLabel}>{t('badgeCatalog.filters.area')}</div>
							<div className={styles.areaTagGroup}>
								{scopedAreas.length === 0 && (
									<span className={styles.areaEmpty}>{t('badgeCatalog.filters.selectServiceLineFirst')}</span>
								)}
								{scopedAreas.map((area) => {
									const areaId = area.area_id || area.areaId;
									const isActive = String(state.areaId) === String(areaId);
									return (
										<button
											key={`${keyPrefix}-area-${areaId}`}
											type="button"
											className={`${styles.areaTag} ${isActive ? styles.areaTagActive : ''}`}
											onClick={() => handlers.onAreaChange(areaId)}
										>
											{area.area_name || area.areaName}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</section>

				<section>
					<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.progression')}</h3>
					<div className={`d-flex flex-column gap-2 ${styles.fieldStack}`}>
						{PROGRESSION_TIERS.map((tier) => (
							<label className={`form-check ${styles.checkboxRow}`} key={`${keyPrefix}-tier-${tier.code}`}>
								<input
									className="form-check-input"
									type="checkbox"
									checked={state.stageCodes.includes(tier.code)}
									onChange={() => handlers.onTierToggle(tier.code)}
								/>
								<span className="form-check-label">{t(tier.labelKey)}</span>
							</label>
						))}
					</div>
				</section>

				<section>
					<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.classification')}</h3>
					<div className={styles.segmented}>
						{['all', 'standard', 'special'].map((value) => (
							<button
								type="button"
								key={`${keyPrefix}-class-${value}`}
								className={`${styles.segmentedBtn} ${state.badgeClass === value ? styles.segmentedBtnActive : ''}`}
								onClick={() => handlers.onBadgeClassChange(value)}
							>
								{t(`badgeCatalog.filters.class.${value}`)}
							</button>
						))}
					</div>
				</section>

				<section>
					<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.points')}</h3>
					<div className={`row g-3 ${styles.fieldStack}`}>
						<div className="col-12">
							<label className={styles.inputLabel} htmlFor={`${keyPrefix}-min-points`}>{t('badgeCatalog.filters.minPoints')}</label>
							<input
								id={`${keyPrefix}-min-points`}
								type="range"
								min={0}
								max={MAX_POINTS}
								step={50}
								className={`form-range ${styles.pointsRange}`}
								value={minPointsValue}
								onChange={(event) => handlers.onPointsChange('minPoints', event.target.value)}
							/>
							<div className={styles.rangeValue}>{minPointsValue}</div>
						</div>
						<div className="col-12">
							<label className={styles.inputLabel} htmlFor={`${keyPrefix}-max-points`}>{t('badgeCatalog.filters.maxPoints')}</label>
							<input
								id={`${keyPrefix}-max-points`}
								type="range"
								min={0}
								max={MAX_POINTS}
								step={50}
								className={`form-range ${styles.pointsRange}`}
								value={maxPointsValue}
								onChange={(event) => handlers.onPointsChange('maxPoints', event.target.value)}
							/>
							<div className={styles.rangeValue}>{maxPointsValue}</div>
						</div>
					</div>
				</section>

				<section>
					<label className={`form-check ${styles.checkboxRow}`}>
						<input
							className="form-check-input"
							type="checkbox"
							checked={state.expiringOnly}
							onChange={(event) => handlers.onExpiringToggle(event.target.checked)}
						/>
						<span className="form-check-label">{t('badgeCatalog.filters.expiringOnly')}</span>
					</label>
				</section>

				{user?.role === 'Consultant' && (
					<section>
						<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.obtainedStatus')}</h3>
						<div className={styles.segmented}>
							{['all', 'true', 'false'].map((value) => (
								<button
									type="button"
									key={`${keyPrefix}-obtained-${value}`}
									className={`${styles.segmentedBtn} ${state.obtained === value ? styles.segmentedBtnActive : ''}`}
									onClick={() => handlers.onObtainedChange(value)}
								>
									{t(`badgeCatalog.filters.obtained.${value}`)}
								</button>
							))}
						</div>
					</section>
				)}
			</div>
		);
	}

	return (
		<>
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h1 className="h3 mb-0">{t('badgeCatalog.title')}</h1>
				<div className="d-flex align-items-center gap-2">
					{user?.role === 'Consultant' && (
						<button
							type="button"
							className={`btn btn-sm ${showingSaved ? 'btn-primary' : 'btn-outline-primary'} d-inline-flex align-items-center gap-1`}
							onClick={() => { setShowingSaved((prev) => !prev); setCurrentPage(1); }}
						>
							<Icon name={showingSaved ? 'bookmark-filled' : 'bookmark'} size={15} aria-hidden="true" />
							{t('badgeCatalog.savedBadges')}
						</button>
					)}
					{hasActiveFilters && (
						<button type="button" className="btn btn-sm btn-outline-primary d-none d-xl-inline-flex" onClick={resetDesktopFilters}>
							{t('badgeCatalog.filters.clear')}
						</button>
					)}
				</div>
			</div>

			<div className={styles.searchWrap}>
				<label htmlFor="badge-catalog-search" className={styles.inputLabel}>
					{t('badgeCatalog.filters.search')}
				</label>
				<div className={styles.searchInputWrap}>
					<Icon name="search" size={16} className={styles.searchIcon} aria-hidden="true" />
					<input
						id="badge-catalog-search"
						type="text"
						className={`form-control ${styles.searchInput}`}
						placeholder={t('badgeCatalog.searchPlaceholder')}
						value={filters.search}
						onChange={(event) => handleDesktopSearchChange(event.target.value)}
					/>
				</div>
			</div>

			<div className="d-xl-none mb-3">
				<button type="button" className={`btn btn-primary w-100 ${styles.mobileFilterButton}`} onClick={openDrawer}>
					<Icon name="filter" size={16} className="me-2" aria-hidden="true" />
					{t('badgeCatalog.filters.open')}
				</button>
			</div>

			<div className="row g-4">
				<aside className="col-xl-3 d-none d-xl-block">
					<div className={`card ${styles.filterCard}`}>
						<div className={`card-body ${styles.filterCardBody}`}>
							{renderFilterGroups(filters, {
								onLearningPathChange: handleDesktopLearningPathChange,
								onServiceLineChange: handleDesktopServiceLineChange,
								onAreaChange: handleDesktopAreaChange,
								onTierToggle: handleDesktopTierToggle,
								onBadgeClassChange: handleDesktopBadgeClassChange,
								onPointsChange: handleDesktopPointsChange,
								onExpiringToggle: handleDesktopExpiringToggle,
								onObtainedChange: handleDesktopObtainedChange,
							})}
						</div>
					</div>
				</aside>

				<section className="col-12 col-xl-9">
					{showingSaved && (
						<div className={`d-flex align-items-center gap-2 mb-3 ${styles.savedBanner}`}>
							<Icon name="bookmark-filled" size={16} aria-hidden="true" />
							<span>{t('badgeCatalog.showingSaved')}</span>
						</div>
					)}
					{loadingBadges ? (
						<CardGridSkeleton count={6} columns={3} />
					) : displayedBadges.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{showingSaved ? t('badgeCatalog.noSavedBadges') : t('badgeCatalog.noBadges')}</h5>
							<p className="text-muted small mb-0">{showingSaved ? t('badgeCatalog.noSavedBadgesDesc') : t('badgeCatalog.noBadgesDesc')}</p>
						</div>
					) : (
						<>
							<div className="row g-3 g-xl-4">
								{displayedBadges.map((badge) => {
									const slug = badge.badge_slug || badge.badgeSlug;
									return (
										<div className="col-sm-6 col-xl-4" key={slug || badge.badge_id || badge.badgeId}>
											<BadgeCard
												badge={badge}
												to={`/badges/${slug}`}
												isConsultant={user?.role === 'Consultant'}
												isFavorited={favoriteSlugs.has(slug)}
												onToggleFavorite={user?.role === 'Consultant' ? handleToggleFavorite : undefined}
											/>
										</div>
									);
								})}
							</div>

							{!showingSaved && (
								<div className="mt-4">
									<Pagination
										currentPage={currentPage}
										totalPages={pagination.totalPages || 0}
										totalItems={pagination.totalItems || 0}
										itemCount={displayedBadges.length}
										onPageChange={(page) => setCurrentPage(page)}
									/>
								</div>
							)}
						</>
					)}
				</section>
			</div>

			{isFilterDrawerOpen ? (
				<>
					<button
						type="button"
						className={styles.drawerBackdrop}
						onClick={() => setIsFilterDrawerOpen(false)}
						aria-label={t('shared.close')}
					/>
					<aside className={styles.drawerPanel} role="dialog" aria-modal="true" aria-label={t('badgeCatalog.filters.open')}>
						<div className={styles.drawerHeader}>
							<h2 className="h5 mb-0">{t('badgeCatalog.filters.title')}</h2>
							<button
								type="button"
								className={styles.drawerClose}
								onClick={() => setIsFilterDrawerOpen(false)}
								aria-label={t('shared.close')}
							>
								<Icon name="close" size={20} aria-hidden="true" />
							</button>
						</div>

						<div className={styles.drawerBody}>
							{renderFilterGroups(mobileDraftFilters, {
								onLearningPathChange: (value) => updateMobileFilters((prev) => ({
									...prev,
									learningPathId: value,
									serviceLineId: '',
									areaId: ''
								})),
								onServiceLineChange: (value) => updateMobileFilters((prev) => ({
									...prev,
									serviceLineId: value,
									areaId: ''
								})),
								onAreaChange: (areaId) => updateMobileFilters((prev) => ({
									...prev,
									areaId: String(prev.areaId) === String(areaId) ? '' : areaId
								})),
								onTierToggle: (code) => updateMobileFilters((prev) => ({
									...prev,
									stageCodes: prev.stageCodes.includes(code)
										? prev.stageCodes.filter((current) => current !== code)
										: [...prev.stageCodes, code]
								})),
								onBadgeClassChange: (value) => updateMobileFilters((prev) => ({ ...prev, badgeClass: value })),
								onPointsChange: (field, value) => updateMobileFilters((prev) => {
									const nextValue = normalizeNumericInput(value);
									if (field === 'minPoints') {
										return {
											...prev,
											minPoints: nextValue,
											maxPoints: Math.max(nextValue, normalizeNumericInput(prev.maxPoints)),
										};
									}
									return {
										...prev,
										maxPoints: nextValue,
										minPoints: Math.min(nextValue, normalizeNumericInput(prev.minPoints)),
									};
								}),
								onExpiringToggle: (checked) => updateMobileFilters((prev) => ({ ...prev, expiringOnly: checked })),
								onObtainedChange: (value) => updateMobileFilters((prev) => ({ ...prev, obtained: value })),
							}, 'mobile')}
						</div>

						<div className={styles.drawerFooter}>
							<button type="button" className="btn btn-outline-primary" onClick={resetMobileFilters}>
								{t('badgeCatalog.filters.clear')}
							</button>
							<button type="button" className="btn btn-primary" onClick={applyMobileFilters}>
								{t('badgeCatalog.filters.apply')}
							</button>
						</div>
					</aside>
				</>
			) : null}
		</>
	);
}
