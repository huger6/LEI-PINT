import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchLevels } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';

const DEBOUNCE_MS = 400;

export default function LevelsList() {
	const { t } = useTranslation();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

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
		fetchLevels({ page, search: debouncedSearch || undefined })
			.then((result) => {
				if (!cancelled) {
					setItems(result.items);
					setPagination(result.pagination);
				}
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => { cancelled = true; };
	}, [page, debouncedSearch]);

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
			statusFilter={statusFilter}
			onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
			loading={loading}
			items={items}
			pagination={pagination}
			page={page}
			onPageChange={setPage}
			emptyTitle={t('structureList.noLevels', { defaultValue: 'No Levels Found' })}
			emptyDescription={t('structureList.noLevelsDesc', { defaultValue: 'Create your first level to get started.' })}
			renderCard={(item) => (
				<StructureItemCard
					key={item.progression_stage_id}
					to={ADMIN.LEVEL_DETAIL.replace(':slug', item.progression_stage_id)}
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
