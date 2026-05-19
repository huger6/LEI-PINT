import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchAreaBySlug, fetchLevelsByArea } from '../../api/structureDetailApi';
import { ADMIN } from '../../../../routes/paths';

const PAGE_SIZE = 32;

export default function AreaDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [area, setArea] = useState(null);
	const [levels, setLevels] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);

	const fetchSubStructures = useCallback((page) => {
		return fetchLevelsByArea(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchAreaBySlug(slug),
			fetchSubStructures(1)
		])
			.then(([areaData, levelsData]) => {
				if (cancelled) return;
				setArea(areaData);
				setLevels(levelsData.items);
				setPagination(levelsData.pagination);
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
			.then((levelsData) => {
				setLevels(levelsData.items);
				setPagination(levelsData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!area) return null;

	const stats = [
		{
			icon: 'tabler_users',
			label: t('shared.consultants', { defaultValue: 'Consultants' }),
			value: Number(area.consultant_count || 0),
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'evolution',
			label: t('shared.structureLabels.stages'),
			value: Number(area.level_count || 0),
			accentColor: '#8d640d',
			accentBg: 'rgba(210, 148, 21, 0.15)',
		},
	];

	const enrollmentMessage = area.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	const subStructures = levels.map((level) => ({
		id: level.progression_stage_id,
		title: level.stage_title,
		description: level.stage_description,
		isActive: level.is_active,
		to: ADMIN.LEVEL_DETAIL.replace(':slug', level.progression_stage_id),
		infoItems: [
			{ icon: 'tabler_users', value: Number(level.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'badge', value: Number(level.badge_count || 0), label: t('shared.badges', { defaultValue: 'Badges' }) },
		],
	}));

	const breadcrumbItems = [];
	const parentSl = area.service_line;
	const parentLp = parentSl?.learning_path;

	if (parentLp) {
		breadcrumbItems.push({
			label: parentLp.path_title,
			path: ADMIN.LEARNING_PATH_DETAIL.replace(':slug', parentLp.path_slug),
		});
	}

	if (parentSl) {
		breadcrumbItems.push({
			label: parentSl.service_line_name,
			path: ADMIN.SERVICE_LINE_DETAIL.replace(':slug', parentSl.sl_slug),
		});
	}

	breadcrumbItems.push({
		label: area.area_name,
		path: ADMIN.AREA_DETAIL.replace(':slug', slug),
	});

	return (
		<StructureDetailLayout
			breadcrumbItems={breadcrumbItems}
			title={area.area_name}
			description={area.area_description}
			icon="area"
			imageUrl={area.img_url}
			tone="areas"
			isActive={area.is_active}
			stats={stats}
			enrollmentMessage={enrollmentMessage}
			subStructures={subStructures}
			subStructureLabel={t('shared.structureLabels.stages')}
			subStructureIcon="evolution"
			subStructureTone="levels"
			addSubLabel={t('structureDetail.addLevel', { defaultValue: 'Add Level' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
			pagination={pagination}
			onPageChange={handlePageChange}
		/>
	);
}
