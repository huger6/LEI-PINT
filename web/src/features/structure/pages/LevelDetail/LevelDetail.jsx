import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLevelByCode, fetchBadgesByLevel } from '../../api/structureDetailApi';

export default function LevelDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [level, setLevel] = useState(null);
	const [badges, setBadges] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLevelByCode(slug),
			fetchBadgesByLevel(slug)
		])
			.then(([levelData, badgesData]) => {
				if (cancelled) return;
				setLevel(levelData);
				setBadges(badgesData.items);
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
	if (!level) return null;

	const activeCount = badges.filter((b) => b.is_active).length;
	const inactiveCount = badges.filter((b) => !b.is_active).length;

	const stats = [
		{
			icon: 'badge',
			label: t('structureDetail.badges', { defaultValue: 'Badges' }),
			value: badges.length,
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

	const subStructures = badges.map((badge) => ({
		id: badge.badge_id,
		title: badge.badge_title,
		description: badge.badge_description,
		isActive: badge.is_active,
	}));

	return (
		<StructureDetailLayout
			title={level.stage_title}
			description={level.stage_description}
			icon="evolution"
			imageUrl={null}
			tone="levels"
			isActive={level.is_active}
			stats={stats}
			subStructures={subStructures}
			subStructureLabel={t('structureDetail.badges', { defaultValue: 'Badges' })}
			subStructureIcon="badge"
			subStructureTone="learningPaths"
			addSubLabel={t('structureDetail.addBadge', { defaultValue: 'Add Badge' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
