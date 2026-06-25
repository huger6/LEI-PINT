import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllLearningPaths, fetchLearningPathsFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CreateLearningPathModal from '../../components/CreateLearningPathModal/CreateLearningPathModal';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 32;

// Paginated, filterable list page of all Learning Paths
export default function LearningPathsList() {
	const { t } = useTranslation();

	// All learning paths fetched from the API (filtered/paginated client-side)
	const [allItems, setAllItems] = useState([]);
	// Whether the list is currently loading
	const [loading, setLoading] = useState(true);
	// Current page number
	const [page, setPage] = useState(1);
	// Raw search input value
	const [search, setSearch] = useState('');
	// Debounced search value used for fetching
	const [debouncedSearch, setDebouncedSearch] = useState('');
	// Create learning path modal visibility
	const [showCreateModal, setShowCreateModal] = useState(false);
	// Bumped to force a re-fetch after a create
	const [refreshKey, setRefreshKey] = useState(0);

	// Active/inactive status filter
	const [statusFilter, setStatusFilter] = useState('all');
	// Max consultant count for the range slider bounds
	const [consultantMax, setConsultantMax] = useState(0);
	// Selected consultant count range
	const [consultantRange, setConsultantRange] = useState([0, 0]);
	// Max service line count for the range slider bounds
	const [serviceLineMax, setServiceLineMax] = useState(0);
	// Selected service line count range
	const [serviceLineRange, setServiceLineRange] = useState([0, 0]);

	// Aggregate stats used to initialise the filter sliders
	const [filterStats, setFilterStats] = useState(null);

	// Load filter stats once and initialise the range sliders
	useEffect(() => {
		fetchLearningPathsFilterStats()
			.then((stats) => {
				setFilterStats(stats);
				setConsultantMax(stats.maxConsultantCount);
				setConsultantRange([0, stats.maxConsultantCount]);
				setServiceLineMax(stats.maxServiceLineCount);
				setServiceLineRange([0, stats.maxServiceLineCount]);
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

	// Fetch learning paths whenever the debounced search or refresh key changes
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		fetchAllLearningPaths({ search: debouncedSearch || undefined })
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

		if (serviceLineRange[0] > 0 || serviceLineRange[1] < serviceLineMax) {
			result = result.filter((item) => {
				const count = Number(item.service_line_count || 0);
				return count >= serviceLineRange[0] && count <= serviceLineRange[1];
			});
		}

		return result;
	}, [allItems, statusFilter, consultantRange, consultantMax, serviceLineRange, serviceLineMax]);

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
	}, [statusFilter, consultantRange, serviceLineRange]);

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
					id="lp_status_filter"
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
					id="lp_consultant_filter"
					label={t('shared.consultants', { defaultValue: 'Consultants' })}
					min={0}
					max={consultantMax}
					value={consultantRange}
					onChange={setConsultantRange}
				/>
			)}
			{filterStats && serviceLineMax > 0 && (
				<RangeSlider
					id="lp_service_line_filter"
					label={t('shared.serviceLines', { defaultValue: 'Service Lines' })}
					min={0}
					max={serviceLineMax}
					value={serviceLineRange}
					onChange={setServiceLineRange}
				/>
			)}
		</>
	), [statusFilter, handleStatusChange, statusOptions, filterStats, consultantMax, consultantRange, serviceLineMax, serviceLineRange, t]);

	// Reset to page one and trigger a re-fetch after creating a learning path
	const handleCreated = useCallback(() => {
		setPage(1);
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<>
			<StructureListLayout
				title={t('shared.structureLabels.learningPaths')}
				icon="learning-path"
				tone="learningPaths"
				addLabel={t('structureList.newLearningPath', { defaultValue: 'New Learning Path' })}
				onAdd={() => setShowCreateModal(true)}
				search={search}
				onSearchChange={(e) => setSearch(e.target.value)}
				searchPlaceholder={t('structureList.searchLearningPaths', { defaultValue: 'Search learning paths...' })}
				renderFilters={renderFilters}
				loading={loading}
				items={paginatedItems}
				pagination={{ totalItems: filtered.length, totalPages, currentPage }}
				page={currentPage}
				onPageChange={setPage}
				emptyTitle={t('structureList.noLearningPaths', { defaultValue: 'No Learning Paths Found' })}
				emptyDescription={t('structureList.noLearningPathsDesc', { defaultValue: 'Create your first learning path to get started.' })}
				renderCard={(item) => (
					<StructureItemCard
						key={item.path_slug}
						to={ADMIN.LEARNING_PATH_DETAIL.replace(':slug', item.path_slug)}
						icon="learning-path"
						title={item.path_title}
						description={item.path_description}
						imageUrl={item.img_url}
						isActive={item.is_active}
						tone="learningPaths"
						infoItems={[
							{ icon: 'tabler_users', value: Number(item.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
							{ icon: 'service-line', value: Number(item.service_line_count || 0), label: t('shared.serviceLines', { defaultValue: 'Service Lines' }) },
						]}
					/>
				)}
			/>

			{showCreateModal && (
				<CreateLearningPathModal
					onClose={() => setShowCreateModal(false)}
					onCreated={handleCreated}
				/>
			)}
		</>
	);
}
