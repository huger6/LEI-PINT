import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchAreaBySlug, fetchLevelsByArea, fetchParentServiceLine, fetchParentLearningPath } from '../../api/structureDetailApi';
import { ADMIN } from '../../../../routes/paths';

export default function AreaDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [area, setArea] = useState(null);
	const [levels, setLevels] = useState([]);
	const [parentSl, setParentSl] = useState(null);
	const [parentLp, setParentLp] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchAreaBySlug(slug),
			fetchLevelsByArea(slug)
		])
			.then(([areaData, levelsData]) => {
				if (cancelled) return;
				setArea(areaData);
				setLevels(levelsData.items);

				if (areaData?.service_line_id) {
					return fetchParentServiceLine(areaData.service_line_id);
				}
				return null;
			})
			.then((slData) => {
				if (cancelled) return;
				if (slData) {
					setParentSl(slData);
					if (slData.learning_path_id) {
						return fetchParentLearningPath(slData.learning_path_id);
					}
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
	}, [slug]);

	if (loading) return <Spinner />;
	if (!area) return null;

	const activeCount = levels.filter((l) => l.is_active).length;
	const inactiveCount = levels.filter((l) => !l.is_active).length;

	const stats = [
		{
			icon: 'evolution',
			label: t('shared.structureLabels.stages'),
			value: levels.length,
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

	const subStructures = levels.map((level) => ({
		id: level.progression_stage_id,
		title: level.stage_title,
		description: level.stage_description,
		isActive: level.is_active,
	}));

	const breadcrumbItems = [];

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
			subStructures={subStructures}
			subStructureLabel={t('shared.structureLabels.stages')}
			subStructureIcon="evolution"
			subStructureTone="levels"
			addSubLabel={t('structureDetail.addLevel', { defaultValue: 'Add Level' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
