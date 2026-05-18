import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchServiceLineBySlug, fetchAreasByServiceLine, fetchParentLearningPath } from '../../api/structureDetailApi';
import { ADMIN } from '../../../../routes/paths';

const PAGE_SIZE = 32;

export default function ServiceLineDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [sl, setSl] = useState(null);
	const [areas, setAreas] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [parentLp, setParentLp] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchSubStructures = useCallback((page) => {
		return fetchAreasByServiceLine(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchServiceLineBySlug(slug),
			fetchSubStructures(1)
		])
			.then(([slData, areasData]) => {
				if (cancelled) return;
				setSl(slData);
				setAreas(areasData.items);
				setPagination(areasData.pagination);
				setCurrentPage(1);

				if (slData?.learning_path_id) {
					return fetchParentLearningPath(slData.learning_path_id);
				}
				return null;
			})
			.then((lpData) => {
				if (cancelled) return;
				if (lpData) setParentLp(lpData);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [slug, fetchSubStructures]);

	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		fetchSubStructures(page)
			.then((areasData) => {
				setAreas(areasData.items);
				setPagination(areasData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!sl) return null;

	const activeCount = areas.filter((a) => a.is_active).length;
	const inactiveCount = areas.filter((a) => !a.is_active).length;

	const stats = [
		{
			icon: 'area',
			label: t('shared.structureLabels.areas'),
			value: pagination?.totalItems ?? areas.length,
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'check_circle',
			label: t('shared.active', { defaultValue: 'Active' }),
			value: activeCount,
			accentColor: '#0f7f69',
			accentBg: 'var(--color-green-soft)',
		},
		{
			icon: 'close_circle',
			label: t('shared.inactive', { defaultValue: 'Inactive' }),
			value: inactiveCount,
			accentColor: '#b91c1c',
			accentBg: 'rgba(239, 68, 68, 0.1)',
		},
	];

	const subStructures = areas.map((area) => ({
		id: area.area_id,
		title: area.area_name,
		description: area.area_description,
		isActive: area.is_active,
		to: ADMIN.AREA_DETAIL.replace(':slug', area.area_slug),
		infoItems: [
			{ icon: 'tabler_users', value: Number(area.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'evolution', value: Number(area.level_count || 0), label: t('shared.levels', { defaultValue: 'Levels' }) },
		],
	}));

	const breadcrumbItems = [];

	if (parentLp) {
		breadcrumbItems.push({
			label: parentLp.path_title,
			path: ADMIN.LEARNING_PATH_DETAIL.replace(':slug', parentLp.path_slug),
		});
	}

	breadcrumbItems.push({
		label: sl.service_line_name,
		path: ADMIN.SERVICE_LINE_DETAIL.replace(':slug', slug),
	});

	return (
		<StructureDetailLayout
			breadcrumbItems={breadcrumbItems}
			title={sl.service_line_name}
			description={sl.service_line_description}
			icon="service-line"
			imageUrl={sl.img_url}
			tone="serviceLines"
			isActive={sl.is_active}
			stats={stats}
			subStructures={subStructures}
			subStructureLabel={t('shared.structureLabels.areas')}
			subStructureIcon="area"
			subStructureTone="areas"
			addSubLabel={t('structureDetail.addArea', { defaultValue: 'Add Area' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
			pagination={pagination}
			onPageChange={handlePageChange}
		/>
	);
}
