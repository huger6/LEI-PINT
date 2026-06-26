import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllLevels, fetchLevelsFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 32;

// Admin page listing all progression levels with search, filters, and pagination
export default function LevelsList() {
	// Translation helper
	const { t } = useTranslation();

	// All fetched level items (unfiltered)
	const [allItems, setAllItems] = useState([]);
	// Loading flag for the list fetch
	const [loading, setLoading] = useState(true);
	// Current pagination page
	const [page, setPage] = useState(1);
	// Raw search input value
	const [search, setSearch] = useState('');
	// Debounced search value used for fetching
	const [debouncedSearch, setDebouncedSearch] = useState('');

	// Active/inactive status filter selection
	const [statusFilter, setStatusFilter] = useState('all');
	// Maximum consultant count for the range slider bound
	const [consultantMax, setConsultantMax] = useState(0);
	// Selected consultant count range
	const [consultantRange, setConsultantRange] = useState([0, 0]);

	// Filter statistics (slider bounds) fetched from the API
	const [filterStats, setFilterStats] = useState(null);

	// Load filter stats once on mount and initialize slider bounds
	useEffect(() => {
		fetchLevelsFilterStats()
			.then((stats) => {
				setFilterStats(stats);
				setConsultantMax(stats.maxConsultantCount);
				setConsultantRange([0, stats.maxConsultantCount]);
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

	// Fetch levels whenever the debounced search changes
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		fetchAllLevels({ search: debouncedSearch || undefined })
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
	}, [debouncedSearch]);

	// Apply status and consultant-range filters client-side
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

		return result;
	}, [allItems, statusFilter, consultantRange, consultantMax]);

	// Derive pagination bounds and slice the current page from the filtered list
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginatedItems = filtered.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	// Reset to the first page whenever filters change
	useEffect(() => {
		setPage(1);
	}, [statusFilter, consultantRange]);

	// Build the status dropdown options (memoized on translation)
	const statusOptions = useMemo(() => [
		{ value: 'all', label: t('shared.allStatuses', { defaultValue: 'All Statuses' }) },
		{ value: 'active', label: t('shared.active', { defaultValue: 'Active' }) },
		{ value: 'inactive', label: t('shared.inactive', { defaultValue: 'Inactive' }) },
	], [t]);

	// Update the status filter from the select control
	const handleStatusChange = useCallback((e) => {
		setStatusFilter(e.target.value);
	}, []);

	// Render the status select and consultant range slider for the layout toolbar
	const renderFilters = useCallback(() => (
		<>
			<div style={{ minWidth: 160 }}>
				<CustomSelect
					id="level_status_filter"
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
					id="level_consultant_filter"
					label={t('shared.consultants', { defaultValue: 'Consultants' })}
					min={0}
					max={consultantMax}
					value={consultantRange}
					onChange={setConsultantRange}
				/>
			)}
		</>
	), [statusFilter, handleStatusChange, statusOptions, filterStats, consultantMax, consultantRange, t]);

	return (
		<StructureListLayout
			title={t('shared.structureLabels.stages')}
			icon="evolution"
			tone="levels"
			addLabel={t('structureList.newLevel', { defaultValue: 'New Level' })}
			onAdd={() => {}}
			search={search}
			onSearchChange={(e) => setSearch(e.target.value)}
			searchPlaceholder={t('structureList.searchLevels', { defaultValue: 'Search levels...' })}
			renderFilters={renderFilters}
			loading={loading}
			items={paginatedItems}
			pagination={{ totalItems: filtered.length, totalPages, currentPage }}
			page={currentPage}
			onPageChange={setPage}
			emptyTitle={t('structureList.noLevels', { defaultValue: 'No Levels Found' })}
			emptyDescription={t('structureList.noLevelsDesc', { defaultValue: 'Create your first level to get started.' })}
			renderCard={(item) => (
				<StructureItemCard
					key={item.progression_stage_id}
					to={ADMIN.LEVEL_DETAIL.replace(':areaSlug', item.area?.area_slug).replace(':stageCode', item.stage_code?.stage_code)}
					icon="evolution"
					title={item.area ? `${item.stage_title} (${item.area.area_name})` : item.stage_title}
					description={item.stage_description}
					isActive={item.is_active}
					meta={item.stage_code?.stage_code || undefined}
					tone="levels"
					infoItems={[
						{ icon: 'tabler_users', value: Number(item.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
						{ icon: 'badge', value: item.has_badge ? t('shared.yes', { defaultValue: 'Yes' }) : t('shared.no', { defaultValue: 'No' }), label: t('shared.badge', { defaultValue: 'Badge' }) },
					]}
				/>
			)}
		/>
	);
}
