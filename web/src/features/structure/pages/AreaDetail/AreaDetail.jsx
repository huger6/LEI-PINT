import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchAreaBySlug, fetchLevelsByArea } from '../../api/structureDetailApi';

export default function AreaDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [area, setArea] = useState(null);
	const [levels, setLevels] = useState([]);
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

	return (
		<StructureDetailLayout
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
