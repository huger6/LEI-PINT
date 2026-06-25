import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllAreas, fetchAreasFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CreateAreaModal from '../../components/CreateAreaModal/CreateAreaModal';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 32;

// Paginated, filterable list page of all Areas
export default function AreasList() {
	const { t } = useTranslation();

	// All areas fetched from the API (filtered/paginated client-side)
	const [allItems, setAllItems] = useState([]);
	// Whether the list is currently loading
	const [loading, setLoading] = useState(true);
	// Current page number
	const [page, setPage] = useState(1);
	// Raw search input value
	const [search, setSearch] = useState('');
	// Debounced search value used for fetching
	const [debouncedSearch, setDebouncedSearch] = useState('');
	// Create area modal visibility
	const [showCreateModal, setShowCreateModal] = useState(false);
	// Bumped to force a re-fetch after a create
	const [refreshKey, setRefreshKey] = useState(0);

	// Active/inactive status filter
	const [statusFilter, setStatusFilter] = useState('all');
	// Max consultant count for the range slider bounds
	const [consultantMax, setConsultantMax] = useState(0);
	// Selected consultant count range
	const [consultantRange, setConsultantRange] = useState([0, 0]);
	// Max level count for the range slider bounds
	const [levelMax, setLevelMax] = useState(0);
	// Selected level count range
	const [levelRange, setLevelRange] = useState([0, 0]);

	// Aggregate stats used to initialise the filter sliders
	const [filterStats, setFilterStats] = useState(null);

	// Load filter stats once and initialise the range sliders
	useEffect(() => {
		fetchAreasFilterStats()
			.then((stats) => {
				setFilterStats(stats);
				setConsultantMax(stats.maxConsultantCount);
				setConsultantRange([0, stats.maxConsultantCount]);
				setLevelMax(stats.maxLevelCount);
				setLevelRange([0, stats.maxLevelCount]);
			})
			.catch(() => {});
	}, []);

	// Debounce the search input before triggering a fetch
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [search]);

	// Fetch areas whenever the debounced search or refresh key changes
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		fetchAllAreas({ search: debouncedSearch || undefined })
			.then((result) => {
				if (!cancelled) setAllItems(result.items);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, [debouncedSearch, refreshKey]);

	// Apply status and count-range filters client-side
	const filtered = useMemo(() => {
		let result = allItems;

		if (statusFilter === 'active') {
			result = result.filter((item) => item.is_active === true);
		} else if (statusFilter === 'inactive') {
			result = result.filter((item) => item.is_active === false);
		}

		if (consultantRange[0] > 0 || consultantRange[1] < consultantMax) {
			result = result.filter((item) => {
				const count = Number(item.consultant_count || 0);
				return count >= consultantRange[0] && count <= consultantRange[1];
			});
		}

		if (levelRange[0] > 0 || levelRange[1] < levelMax) {
			result = result.filter((item) => {
				const count = Number(item.level_count || 0);
				return count >= levelRange[0] && count <= levelRange[1];
			});
		}

		return result;
	}, [allItems, statusFilter, consultantRange, consultantMax, levelRange, levelMax]);

	// Derive pagination values and the current page's slice
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginatedItems = filtered.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	// Reset to the first page whenever a filter changes
	useEffect(() => {
		setPage(1);
	}, [statusFilter, consultantRange, levelRange]);

	// Options for the status filter select
	const statusOptions = useMemo(() => [
		{ value: 'all', label: t('shared.allStatuses', { defaultValue: 'All Statuses' }) },
		{ value: 'active', label: t('shared.active', { defaultValue: 'Active' }) },
		{ value: 'inactive', label: t('shared.inactive', { defaultValue: 'Inactive' }) },
	], [t]);

	// Update the status filter from the select
	const handleStatusChange = useCallback((e) => {
		setStatusFilter(e.target.value);
	}, []);

	// Render the filter controls passed into the list layout
	const renderFilters = useCallback(() => (
		<>
			<div style={{ minWidth: 160 }}>
				<CustomSelect
					id="area_status_filter"
					name="statusFilter"
					value={statusFilter}
					onChange={handleStatusChange}
					options={statusOptions}
					placeholder={t('shared.allStatuses', { defaultValue: 'All Statuses' })}
					ariaLabel={t('shared.status', { defaultValue: 'Status' })}
				/>
			</div>
			{filterStats && consultantMax > 0 && (
				<RangeSlider
					id="area_consultant_filter"
					label={t('shared.consultants', { defaultValue: 'Consultants' })}
					min={0}
					max={consultantMax}
					value={consultantRange}
					onChange={setConsultantRange}
				/>
			)}
			{filterStats && levelMax > 0 && (
				<RangeSlider
					id="area_level_filter"
					label={t('shared.levels', { defaultValue: 'Levels' })}
					min={0}
					max={levelMax}
					value={levelRange}
					onChange={setLevelRange}
				/>
			)}
		</>
	), [statusFilter, handleStatusChange, statusOptions, filterStats, consultantMax, consultantRange, levelMax, levelRange, t]);

	// Reset to page one and trigger a re-fetch after creating an area
	const handleCreated = useCallback(() => {
		setPage(1);
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<>
			<StructureListLayout
				title={t('shared.structureLabels.areas')}
				icon="area"
				tone="areas"
				addLabel={t('structureList.newArea', { defaultValue: 'New Area' })}
				onAdd={() => setShowCreateModal(true)}
				search={search}
				onSearchChange={(e) => setSearch(e.target.value)}
				searchPlaceholder={t('structureList.searchAreas', { defaultValue: 'Search areas...' })}
				renderFilters={renderFilters}
				loading={loading}
				items={paginatedItems}
				pagination={{ totalItems: filtered.length, totalPages, currentPage }}
				page={currentPage}
				onPageChange={setPage}
				emptyTitle={t('structureList.noAreas', { defaultValue: 'No Areas Found' })}
				emptyDescription={t('structureList.noAreasDesc', { defaultValue: 'Create your first area to get started.' })}
				renderCard={(item) => (
					<StructureItemCard
						key={item.area_slug}
						to={ADMIN.AREA_DETAIL.replace(':slug', item.area_slug)}
						icon="area"
						title={item.area_name}
						description={item.area_description}
						imageUrl={item.img_url}
						isActive={item.is_active}
						meta={item.area_code || undefined}
						tone="areas"
						infoItems={[
							{ icon: 'tabler_users', value: Number(item.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
							{ icon: 'evolution', value: Number(item.level_count || 0), label: t('shared.levels', { defaultValue: 'Levels' }) },
						]}
					/>
				)}
			/>

			{showCreateModal && (
				<CreateAreaModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={handleCreated}
				/>
			)}
		</>
	);
}
