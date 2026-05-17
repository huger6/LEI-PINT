import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAllLevels, fetchLevelsFilterStats } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import RangeSlider from '../../../../components/RangeSlider/RangeSlider';

const DEBOUNCE_MS = 400;
const PAGE_SIZE = 12;

export default function LevelsList() {
	const { t } = useTranslation();

	const [allItems, setAllItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	const [statusFilter, setStatusFilter] = useState('all');
	const [consultantMax, setConsultantMax] = useState(0);
	const [consultantRange, setConsultantRange] = useState([0, 0]);
	const [badgeMax, setBadgeMax] = useState(0);
	const [badgeRange, setBadgeRange] = useState([0, 0]);

	const [filterStats, setFilterStats] = useState(null);

	useEffect(() => {
		fetchLevelsFilterStats()
			.then((stats) => {
				setFilterStats(stats);
				setConsultantMax(stats.maxConsultantCount);
				setConsultantRange([0, stats.maxConsultantCount]);
				setBadgeMax(stats.maxBadgeCount);
				setBadgeRange([0, stats.maxBadgeCount]);
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

		if (badgeRange[0] > 0 || badgeRange[1] < badgeMax) {
			result = result.filter((item) => {
				const count = Number(item.badge_count || 0);
				return count >= badgeRange[0] && count <= badgeRange[1];
			});
		}

		return result;
	}, [allItems, statusFilter, consultantRange, consultantMax, badgeRange, badgeMax]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages);
	const paginatedItems = filtered.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	);

	useEffect(() => {
		setPage(1);
	}, [statusFilter, consultantRange, badgeRange]);

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
			{filterStats && badgeMax > 0 && (
				<RangeSlider
					id="level_badge_filter"
					label={t('shared.badges', { defaultValue: 'Badges' })}
					min={0}
					max={badgeMax}
					value={badgeRange}
					onChange={setBadgeRange}
				/>
			)}
		</>
	), [statusFilter, handleStatusChange, statusOptions, filterStats, consultantMax, consultantRange, badgeMax, badgeRange, t]);

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
					to={ADMIN.LEVEL_DETAIL.replace(':slug', item.stage_code?.stage_code || item.progression_stage_id)}
					icon="evolution"
					title={item.stage_title}
					description={item.stage_description}
					isActive={item.is_active}
					meta={item.stage_sequence ? `#${item.stage_sequence}` : undefined}
					tone="levels"
				/>
			)}
		/>
	);
}
