import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllServiceLines, fetchServiceLinesFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CreateServiceLineModal from '../../components/CreateServiceLineModal/CreateServiceLineModal';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 32;

// Admin page listing all service lines with search, filters, and pagination
export default function ServiceLinesList() {
	// Translation helper
	const { t } = useTranslation();

	// All fetched service line items (unfiltered)
	const [allItems, setAllItems] = useState([]);
	// Loading flag for the list fetch
	const [loading, setLoading] = useState(true);
	// Current pagination page
	const [page, setPage] = useState(1);
	// Raw search input value
	const [search, setSearch] = useState('');
	// Debounced search value used for fetching
	const [debouncedSearch, setDebouncedSearch] = useState('');
	// Create service line modal visibility
	const [showCreateModal, setShowCreateModal] = useState(false);
	// Key bumped to force a list refresh after creation
	const [refreshKey, setRefreshKey] = useState(0);

	// Active/inactive status filter selection
	const [statusFilter, setStatusFilter] = useState('all');
	// Maximum consultant count for the range slider bound
	const [consultantMax, setConsultantMax] = useState(0);
	// Selected consultant count range
	const [consultantRange, setConsultantRange] = useState([0, 0]);
	// Maximum area count for the range slider bound
	const [areaMax, setAreaMax] = useState(0);
	// Selected area count range
	const [areaRange, setAreaRange] = useState([0, 0]);

	// Filter statistics (slider bounds) fetched from the API
	const [filterStats, setFilterStats] = useState(null);

	// Load filter stats once on mount and initialize slider bounds
	useEffect(() => {
		fetchServiceLinesFilterStats()
			.then((stats) => {
				setFilterStats(stats);
				setConsultantMax(stats.maxConsultantCount);
				setConsultantRange([0, stats.maxConsultantCount]);
				setAreaMax(stats.maxAreaCount);
				setAreaRange([0, stats.maxAreaCount]);
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

	// Fetch service lines whenever the debounced search or refresh key changes
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		fetchAllServiceLines({ search: debouncedSearch || undefined })
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

	// Apply status, consultant-range, and area-range filters client-side
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

		if (areaRange[0] > 0 || areaRange[1] < areaMax) {
			result = result.filter((item) => {
				const count = Number(item.area_count || 0);
				return count >= areaRange[0] && count <= areaRange[1];
			});
		}

		return result;
	}, [allItems, statusFilter, consultantRange, consultantMax, areaRange, areaMax]);

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
	}, [statusFilter, consultantRange, areaRange]);

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

	// Render the status select and range sliders for the layout toolbar
	const renderFilters = useCallback(() => (
		<>
			<div style={{ minWidth: 160 }}>
				<CustomSelect
					id="sl_status_filter"
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
					id="sl_consultant_filter"
					label={t('shared.consultants', { defaultValue: 'Consultants' })}
					min={0}
					max={consultantMax}
					value={consultantRange}
					onChange={setConsultantRange}
				/>
			)}
			{filterStats && areaMax > 0 && (
				<RangeSlider
					id="sl_area_filter"
					label={t('shared.areas', { defaultValue: 'Areas' })}
					min={0}
					max={areaMax}
					value={areaRange}
					onChange={setAreaRange}
				/>
			)}
		</>
	), [statusFilter, handleStatusChange, statusOptions, filterStats, consultantMax, consultantRange, areaMax, areaRange, t]);

	// Reset to page one and trigger a list refresh after a service line is created
	const handleCreated = useCallback(() => {
		setPage(1);
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<>
			<StructureListLayout
				title={t('shared.structureLabels.serviceLines')}
				icon="service-line"
				tone="serviceLines"
				addLabel={t('structureList.newServiceLine', { defaultValue: 'New Service Line' })}
				onAdd={() => setShowCreateModal(true)}
				search={search}
				onSearchChange={(e) => setSearch(e.target.value)}
				searchPlaceholder={t('structureList.searchServiceLines', { defaultValue: 'Search service lines...' })}
				renderFilters={renderFilters}
				loading={loading}
				items={paginatedItems}
				pagination={{ totalItems: filtered.length, totalPages, currentPage }}
				page={currentPage}
				onPageChange={setPage}
				emptyTitle={t('structureList.noServiceLines', { defaultValue: 'No Service Lines Found' })}
				emptyDescription={t('structureList.noServiceLinesDesc', { defaultValue: 'Create your first service line to get started.' })}
				renderCard={(item) => (
					<StructureItemCard
						key={item.sl_slug}
						to={ADMIN.SERVICE_LINE_DETAIL.replace(':slug', item.sl_slug)}
						icon="service-line"
						title={item.service_line_name}
						description={item.service_line_description}
						imageUrl={item.img_url}
						isActive={item.is_active}
						tone="serviceLines"
						infoItems={[
							{ icon: 'tabler_users', value: Number(item.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
							{ icon: 'area', value: Number(item.area_count || 0), label: t('shared.areas', { defaultValue: 'Areas' }) },
						]}
					/>
				)}
			/>

			{showCreateModal && (
				<CreateServiceLineModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={handleCreated}
				/>
			)}
		</>
	);
}
