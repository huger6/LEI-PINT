import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN } from '../../../../routes/paths';
import { fetchServiceLines } from '../../api/structureListApi';
import StructureListLayout from '../../layouts/StructureListLayout/StructureListLayout';
import StructureItemCard from '../../components/StructureItemCard/StructureItemCard';

const DEBOUNCE_MS = 400;

export default function ServiceLinesList() {
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
		fetchServiceLines({ page, search: debouncedSearch || undefined })
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
			title={t('shared.structureLabels.serviceLines')}
			icon="service-line"
			tone="serviceLines"
			addLabel={t('structureList.newServiceLine', { defaultValue: 'New Service Line' })}
			onAdd={() => {}}
			search={search}
			onSearchChange={(e) => setSearch(e.target.value)}
			searchPlaceholder={t('structureList.searchServiceLines', { defaultValue: 'Search service lines...' })}
			statusFilter={statusFilter}
			onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
			loading={loading}
			items={items}
			pagination={pagination}
			page={page}
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
