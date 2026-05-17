import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllServiceLines, fetchServiceLinesFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 12;

export default function ServiceLinesList() {
	const { t } = useTranslation();

	const [allItems, setAllItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	const [statusFilter, setStatusFilter] = useState('all');
	const [consultantMax, setConsultantMax] = useState(0);
	const [consultantRange, setConsultantRange] = useState([0, 0]);
	const [areaMax, setAreaMax] = useState(0);
	const [areaRange, setAreaRange] = useState([0, 0]);

	const [filterStats, setFilterStats] = useState(null);

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

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1);
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [search]);

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
	}, [debouncedSearch]);

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

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginatedItems = filtered.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	useEffect(() => {
		setPage(1);
	}, [statusFilter, consultantRange, areaRange]);

	const statusOptions = useMemo(() => [
		{ value: 'all', label: t('shared.allStatuses', { defaultValue: 'All Statuses' }) },
		{ value: 'active', label: t('shared.active', { defaultValue: 'Active' }) },
		{ value: 'inactive', label: t('shared.inactive', { defaultValue: 'Inactive' }) },
	], [t]);

	const handleStatusChange = useCallback((e) => {
		setStatusFilter(e.target.value);
	}, []);

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

	return (
		<StructureListLayout
			title={t('shared.structureLabels.serviceLines')}
			icon="service-line"
			tone="serviceLines"
			addLabel={t('structureList.newServiceLine', { defaultValue: 'New Service Line' })}
			onAdd={() => {}}
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
				/>
			)}
		/>
	);
}
