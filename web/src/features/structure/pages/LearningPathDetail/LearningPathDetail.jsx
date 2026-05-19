import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLearningPathBySlug, fetchServiceLinesByLearningPath } from '../../api/structureDetailApi';
import { ADMIN } from '../../../../routes/paths';

const PAGE_SIZE = 32;

export default function LearningPathDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [lp, setLp] = useState(null);
	const [serviceLines, setServiceLines] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);

	const fetchSubStructures = useCallback((page) => {
		return fetchServiceLinesByLearningPath(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLearningPathBySlug(slug),
			fetchSubStructures(1)
		])
			.then(([lpData, slData]) => {
				if (cancelled) return;
				setLp(lpData);
				setServiceLines(slData.items);
				setPagination(slData.pagination);
				setCurrentPage(1);
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
			.then((slData) => {
				setServiceLines(slData.items);
				setPagination(slData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!lp) return null;

	const stats = [
		{
			icon: 'tabler_users',
			label: t('shared.consultants', { defaultValue: 'Consultants' }),
			value: Number(lp.consultant_count || 0),
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'service-line',
			label: t('shared.structureLabels.serviceLines'),
			value: Number(lp.service_line_count || 0),
			accentColor: '#274f82',
			accentBg: 'rgba(57, 99, 156, 0.17)',
		},
	];

	const enrollmentMessage = lp.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	const subStructures = serviceLines.map((sl) => ({
		id: sl.service_line_id,
		title: sl.service_line_name,
		description: sl.service_line_description,
		isActive: sl.is_active,
		to: ADMIN.SERVICE_LINE_DETAIL.replace(':slug', sl.sl_slug),
		infoItems: [
			{ icon: 'tabler_users', value: Number(sl.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'area', value: Number(sl.area_count || 0), label: t('shared.areas', { defaultValue: 'Areas' }) },
		],
	}));

	const breadcrumbItems = [
		{
			label: lp.path_title,
			path: ADMIN.LEARNING_PATH_DETAIL.replace(':slug', slug),
		},
	];

	return (
		<StructureDetailLayout
			breadcrumbItems={breadcrumbItems}
			title={lp.path_title}
			description={lp.path_description}
			icon="learning-path"
			imageUrl={lp.img_url}
			tone="learningPaths"
			isActive={lp.is_active}
			stats={stats}
			enrollmentMessage={enrollmentMessage}
			subStructures={subStructures}
			subStructureLabel={t('shared.structureLabels.serviceLines')}
			subStructureIcon="service-line"
			subStructureTone="serviceLines"
			addSubLabel={t('structureDetail.addServiceLine', { defaultValue: 'Add Service Line' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
			pagination={pagination}
			onPageChange={handlePageChange}
		/>
	);
}
