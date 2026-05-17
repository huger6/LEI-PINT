import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLearningPathBySlug, fetchServiceLinesByLearningPath } from '../../api/structureDetailApi';
import { ADMIN } from '../../../../routes/paths';

export default function LearningPathDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [lp, setLp] = useState(null);
	const [serviceLines, setServiceLines] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLearningPathBySlug(slug),
			fetchServiceLinesByLearningPath(slug)
		])
			.then(([lpData, slData]) => {
				if (cancelled) return;
				setLp(lpData);
				setServiceLines(slData.items);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [slug]);

	if (loading) return <Spinner />;
	if (!lp) return null;

	const activeCount = serviceLines.filter((sl) => sl.is_active).length;
	const inactiveCount = serviceLines.filter((sl) => !sl.is_active).length;

	const stats = [
		{
			icon: 'service-line',
			label: t('shared.structureLabels.serviceLines'),
			value: serviceLines.length,
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

	const subStructures = serviceLines.map((sl) => ({
		id: sl.service_line_id,
		title: sl.service_line_name,
		description: sl.service_line_description,
		isActive: sl.is_active,
	}));

	const breadcrumbItems = [
		{
			label: t('shared.structureLabels.learningPaths'),
			path: ADMIN.LEARNING_PATHS,
		},
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
			subStructures={subStructures}
			subStructureLabel={t('shared.structureLabels.serviceLines')}
			subStructureIcon="service-line"
			subStructureTone="serviceLines"
			addSubLabel={t('structureDetail.addServiceLine', { defaultValue: 'Add Service Line' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
