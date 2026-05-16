import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchLearningPaths } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';

const DEBOUNCE_MS = 400;

export default function LearningPathsList() {
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
		fetchLearningPaths({ page, search: debouncedSearch || undefined })
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
			title={t('shared.structureLabels.learningPaths')}
			icon="learning-path"
			tone="learningPaths"
			addLabel={t('structureList.newLearningPath', { defaultValue: 'New Learning Path' })}
			onAdd={() => {}}
			search={search}
			onSearchChange={(e) => setSearch(e.target.value)}
			searchPlaceholder={t('structureList.searchLearningPaths', { defaultValue: 'Search learning paths...' })}
			statusFilter={statusFilter}
			onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
			loading={loading}
			items={items}
			pagination={pagination}
			page={page}
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
				/>
			)}
		/>
	);
}
