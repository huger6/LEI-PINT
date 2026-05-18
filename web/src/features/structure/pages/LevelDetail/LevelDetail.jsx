import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLevelByCode, fetchBadgesByLevel, fetchParentArea, fetchParentServiceLine, fetchParentLearningPath } from '../../api/structureDetailApi';
import { ADMIN, SHARED } from '../../../../routes/paths';

const PAGE_SIZE = 32;

export default function LevelDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();
	const [level, setLevel] = useState(null);
	const [badges, setBadges] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [parentArea, setParentArea] = useState(null);
	const [parentSl, setParentSl] = useState(null);
	const [parentLp, setParentLp] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchSubStructures = useCallback((page) => {
		return fetchBadgesByLevel(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLevelByCode(slug),
			fetchSubStructures(1)
		])
			.then(([levelData, badgesData]) => {
				if (cancelled) return;
				setLevel(levelData);
				setBadges(badgesData.items);
				setPagination(badgesData.pagination);
				setCurrentPage(1);

				if (levelData?.area_id) {
					return fetchParentArea(levelData.area_id);
				}
				return null;
			})
			.then((areaData) => {
				if (cancelled) return;
				if (areaData) {
					setParentArea(areaData);
					if (areaData.service_line_id) {
						return fetchParentServiceLine(areaData.service_line_id);
					}
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
	}, [slug, fetchSubStructures]);

	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		fetchSubStructures(page)
			.then((badgesData) => {
				setBadges(badgesData.items);
				setPagination(badgesData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!level) return null;

	const activeCount = badges.filter((b) => b.is_active).length;
	const inactiveCount = badges.filter((b) => !b.is_active).length;

	const stats = [
		{
			icon: 'badge',
			label: t('structureDetail.badges', { defaultValue: 'Badges' }),
			value: pagination?.totalItems ?? badges.length,
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
		to: SHARED.BADGE_DETAIL.replace(':slug', badge.badge_slug),
		infoItems: [
			{ icon: 'tabler_users', value: Number(badge.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
		],
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

	if (parentArea) {
		breadcrumbItems.push({
			label: parentArea.area_name,
			path: ADMIN.AREA_DETAIL.replace(':slug', parentArea.area_slug),
		});
	}

	breadcrumbItems.push({
		label: level.stage_title,
		path: ADMIN.LEVEL_DETAIL.replace(':slug', slug),
	});

	return (
		<StructureDetailLayout
			breadcrumbItems={breadcrumbItems}
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
			pagination={pagination}
			onPageChange={handlePageChange}
		/>
	);
}
