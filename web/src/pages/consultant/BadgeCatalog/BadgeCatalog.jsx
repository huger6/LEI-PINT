import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BadgeCard from '../../../components/BadgeCard/BadgeCard';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import Pagination from '../../../components/Pagination/Pagination';
import { getBadgesCatalog } from '../../../features/badges/api/badgesApi';
import { getAreas, getLearningPaths, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { useUser } from '../../../hooks/userContext';
import styles from './BadgeCatalog.module.css';

const PAGE_SIZE = 12;

const PROGRESSION_TIERS = [
	{ code: 'A', label: 'Junior (A)' },
	{ code: 'B', label: 'Intermediate (B)' },
	{ code: 'C', label: 'Senior (C)' },
	{ code: 'D', label: 'Specialist (D)' },
	{ code: 'E', label: 'Knowledge Leader (E)' },
];

const EMPTY_FILTERS = {
	search: '',
	learningPathId: '',
	serviceLineId: '',
	areaId: '',
	stageCodes: [],
	badgeClass: 'all',
	minPoints: '',
	maxPoints: '',
	expiringOnly: false,
};

function normalizeNumericInput(value) {
	if (value === '' || value === null || value === undefined) return '';
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : '';
}

function normalizeFilters(filters) {
	return {
		...filters,
		minPoints: normalizeNumericInput(filters.minPoints),
		maxPoints: normalizeNumericInput(filters.maxPoints),
	};
}

export default function BadgeCatalog() {
	const { t } = useTranslation();
	const { user } = useUser();

	const [loadingPage, setLoadingPage] = useState(true);
	const [loadingBadges, setLoadingBadges] = useState(false);
	const [error, setError] = useState(null);
	const [badges, setBadges] = useState([]);
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	const [currentPage, setCurrentPage] = useState(1);

	const [learningPaths, setLearningPaths] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);

	const [filters, setFilters] = useState(EMPTY_FILTERS);
	const [mobileDraftFilters, setMobileDraftFilters] = useState(EMPTY_FILTERS);
	const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
	const [defaultAreaApplied, setDefaultAreaApplied] = useState(false);

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
				setError(err.message);
			} finally {
				if (!ignore) setLoadingPage(false);
			}
		}

		loadFilterOptions();
		return () => { ignore = true; };
	}, []);

	const serviceLineById = useMemo(() => {
		const map = new Map();
		serviceLines.forEach((sl) => {
			const id = sl.service_line_id || sl.serviceLineId;
			if (!id) return;
			map.set(id, sl);
		});
		return map;
	}, [serviceLines]);

	useEffect(() => {
		if (defaultAreaApplied || areas.length === 0 || serviceLines.length === 0) return;

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
	}, [areas, defaultAreaApplied, serviceLineById, serviceLines, user]);

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
				if (filters.minPoints !== '') params.minPoints = Number(filters.minPoints);
				if (filters.maxPoints !== '') params.maxPoints = Number(filters.maxPoints);
				if (filters.expiringOnly) params.expiringOnly = true;

				const response = await getBadgesCatalog(params);

				if (ignore) return;
				setBadges(response.data || []);
				setPagination(response.pagination || { totalItems: 0, totalPages: 0, currentPage: 1 });
			} catch (err) {
				if (ignore) return;
				setError(err.message);
			} finally {
				if (!ignore) setLoadingBadges(false);
			}
		}

		loadBadges();
		return () => { ignore = true; };
	}, [currentPage, filters]);

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

	function updateFilters(updater) {
		setFilters((prev) => {
			const next = normalizeFilters(typeof updater === 'function' ? updater(prev) : updater);
			return next;
		});
		setCurrentPage(1);
	}

	function handleDesktopSearchChange(value) {
		updateFilters((prev) => ({ ...prev, search: value }));
	}

	function handleDesktopLearningPathChange(value) {
		updateFilters((prev) => ({
			...prev,
			learningPathId: value,
			serviceLineId: '',
			areaId: ''
		}));
	}

	function handleDesktopServiceLineChange(value) {
		updateFilters((prev) => ({
			...prev,
			serviceLineId: value,
			areaId: ''
		}));
	}

	function handleDesktopAreaChange(areaId) {
		updateFilters((prev) => ({ ...prev, areaId: String(areaId) === String(prev.areaId) ? '' : areaId }));
	}

	function handleDesktopTierToggle(code) {
		updateFilters((prev) => ({
			...prev,
			stageCodes: prev.stageCodes.includes(code)
				? prev.stageCodes.filter((current) => current !== code)
				: [...prev.stageCodes, code]
		}));
	}

	function handleDesktopBadgeClassChange(value) {
		updateFilters((prev) => ({ ...prev, badgeClass: value }));
	}

	function handleDesktopPointsChange(field, value) {
		updateFilters((prev) => ({ ...prev, [field]: value }));
	}

	function handleDesktopExpiringToggle(checked) {
		updateFilters((prev) => ({ ...prev, expiringOnly: checked }));
	}

	function resetDesktopFilters() {
		updateFilters(EMPTY_FILTERS);
	}

	function openDrawer() {
		setMobileDraftFilters(filters);
		setIsFilterDrawerOpen(true);
	}

	function applyMobileFilters() {
		const nextFilters = normalizeFilters(mobileDraftFilters);
		setFilters(nextFilters);
		setCurrentPage(1);
		setIsFilterDrawerOpen(false);
	}

	function updateMobileFilters(updater) {
		setMobileDraftFilters((prev) => normalizeFilters(typeof updater === 'function' ? updater(prev) : updater));
	}

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
					<aside className="col-lg-3 d-none d-lg-block" />
					<section className="col-12 col-lg-9">
						<CardGridSkeleton count={6} columns={3} />
					</section>
				</div>
			</>
		);
	}

	if (error && badges.length === 0) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('badgeCatalog.errorLoading', { error })}
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
		filters.minPoints !== '' ||
		filters.maxPoints !== '' ||
		filters.expiringOnly;

	function renderFilterGroups(state, handlers, keyPrefix = 'desktop') {
		const scopedServiceLines = state.learningPathId
			? serviceLines.filter((sl) => String(sl.learning_path_id || sl.learningPathId) === String(state.learningPathId))
			: [];
		const scopedAreas = state.serviceLineId
			? areas.filter((area) => String(area.service_line_id || area.serviceLineId) === String(state.serviceLineId))
			: [];

		return (
			<div className="d-flex flex-column gap-4">
				<section>
					<h3 className={styles.filterHeading}>{t('badgeCatalog.filters.structure')}</h3>
					<div className="d-flex flex-column gap-2">
						<select
							className={`form-select ${styles.filterControl}`}
							value={state.learningPathId}
							onChange={(event) => handlers.onLearningPathChange(event.target.value)}
						>
							<option value="">{t('badgeCatalog.filters.allLearningPaths')}</option>
							{learningPaths.map((lp) => (
								<option key={lp.path_slug || lp.pathSlug} value={lp.learning_path_id || lp.learningPathId}>
									{lp.path_title || lp.pathTitle}
								</option>
							))}
						</select>

						<select
							className={`form-select ${styles.filterControl}`}
							value={state.serviceLineId}
							disabled={!state.learningPathId}
							onChange={(event) => handlers.onServiceLineChange(event.target.value)}
						>
							<option value="">{t('badgeCatalog.filters.allServiceLines')}</option>
							{scopedServiceLines.map((sl) => (
								<option key={sl.sl_slug || sl.slSlug} value={sl.service_line_id || sl.serviceLineId}>
									{sl.service_line_name || sl.serviceLineName}
								</option>
							))}
						</select>

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
					<div className="d-flex flex-column gap-2">
						{PROGRESSION_TIERS.map((tier) => (
							<label className={`form-check ${styles.checkboxRow}`} key={`${keyPrefix}-tier-${tier.code}`}>
								<input
									className="form-check-input"
									type="checkbox"
									checked={state.stageCodes.includes(tier.code)}
									onChange={() => handlers.onTierToggle(tier.code)}
								/>
								<span className="form-check-label">{tier.label}</span>
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
					<div className="row g-2">
						<div className="col-6">
							<label className={styles.inputLabel} htmlFor={`${keyPrefix}-min-points`}>{t('badgeCatalog.filters.minPoints')}</label>
							<input
								id={`${keyPrefix}-min-points`}
								type="number"
								min={0}
								className={`form-control ${styles.filterControl}`}
								value={state.minPoints}
								onChange={(event) => handlers.onPointsChange('minPoints', event.target.value)}
							/>
						</div>
						<div className="col-6">
							<label className={styles.inputLabel} htmlFor={`${keyPrefix}-max-points`}>{t('badgeCatalog.filters.maxPoints')}</label>
							<input
								id={`${keyPrefix}-max-points`}
								type="number"
								min={0}
								className={`form-control ${styles.filterControl}`}
								value={state.maxPoints}
								onChange={(event) => handlers.onPointsChange('maxPoints', event.target.value)}
							/>
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
			</div>
		);
	}

	return (
		<>
			<div className="d-flex align-items-center justify-content-between mb-3">
				<h1 className="h3 mb-0">{t('badgeCatalog.title')}</h1>
				{hasActiveFilters ? (
					<button type="button" className="btn btn-sm btn-outline-primary d-none d-lg-inline-flex" onClick={resetDesktopFilters}>
						{t('badgeCatalog.filters.clear')}
					</button>
				) : null}
			</div>

			<div className={styles.searchWrap}>
				<Icon name="search" size={16} className={styles.searchIcon} aria-hidden="true" />
				<input
					type="text"
					className={`form-control ${styles.searchInput}`}
					placeholder={t('badgeCatalog.searchPlaceholder')}
					value={filters.search}
					onChange={(event) => handleDesktopSearchChange(event.target.value)}
				/>
			</div>

			<div className="d-lg-none mb-3">
				<button type="button" className={`btn btn-primary w-100 ${styles.mobileFilterButton}`} onClick={openDrawer}>
					{t('badgeCatalog.filters.open')}
				</button>
			</div>

			<div className="row g-4">
				<aside className="col-lg-3 d-none d-lg-block">
					<div className={`card ${styles.filterCard}`}>
						<div className="card-body p-3 p-xl-4">
							{renderFilterGroups(filters, {
								onLearningPathChange: handleDesktopLearningPathChange,
								onServiceLineChange: handleDesktopServiceLineChange,
								onAreaChange: handleDesktopAreaChange,
								onTierToggle: handleDesktopTierToggle,
								onBadgeClassChange: handleDesktopBadgeClassChange,
								onPointsChange: handleDesktopPointsChange,
								onExpiringToggle: handleDesktopExpiringToggle,
							})}
						</div>
					</div>
				</aside>

				<section className="col-12 col-lg-9">
					{loadingBadges ? (
						<CardGridSkeleton count={6} columns={3} />
					) : badges.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('badgeCatalog.noBadges')}</h5>
							<p className="text-muted small mb-0">{t('badgeCatalog.noBadgesDesc')}</p>
						</div>
					) : (
						<>
							<div className="row g-3 g-xl-4">
								{badges.map((badge) => {
									const slug = badge.badge_slug || badge.badgeSlug;
									return (
										<div className="col-sm-6 col-xl-4" key={slug || badge.badge_id || badge.badgeId}>
											<BadgeCard badge={badge} to={`/badges/${slug}`} />
										</div>
									);
								})}
							</div>

							<div className="mt-4">
								<Pagination
									currentPage={currentPage}
									totalPages={pagination.totalPages || 0}
									totalItems={pagination.totalItems || 0}
									itemCount={badges.length}
									onPageChange={(page) => setCurrentPage(page)}
								/>
							</div>
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
								onPointsChange: (field, value) => updateMobileFilters((prev) => ({ ...prev, [field]: value })),
								onExpiringToggle: (checked) => updateMobileFilters((prev) => ({ ...prev, expiringOnly: checked })),
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
