import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchAreas } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';

const DEBOUNCE_MS = 400;

export default function AreasList() {
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
		setPage(1);
	}, [statusFilter]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		fetchAreas({ page, search: debouncedSearch || undefined, status: statusFilter !== 'all' ? statusFilter : undefined })
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
	}, [page, debouncedSearch, statusFilter]);

	return (
		<StructureListLayout
			title={t('shared.structureLabels.areas')}
			icon="area"
			tone="areas"
			addLabel={t('structureList.newArea', { defaultValue: 'New Area' })}
			onAdd={() => {}}
			search={search}
			onSearchChange={(e) => setSearch(e.target.value)}
			searchPlaceholder={t('structureList.searchAreas', { defaultValue: 'Search areas...' })}
			statusFilter={statusFilter}
			onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
			loading={loading}
			items={items}
			pagination={pagination}
			page={page}
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
				/>
			)}
		/>
	);
}
