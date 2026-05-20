import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLevelByCode, fetchBadgesByLevel } from '../../api/structureDetailApi';
import { deleteLevel, activateLevel } from '../../api/structureListApi';
import { ADMIN, SHARED } from '../../../../routes/paths';
import CreateLevelModal from '../../components/CreateLevelModal/CreateLevelModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

export default function LevelDetail() {
	const { areaSlug, stageCode: stageCodeParam } = useParams();
	const { t } = useTranslation();
	const [level, setLevel] = useState(null);
	const [badges, setBadges] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

	const fetchSubStructures = useCallback((page) => {
		return fetchBadgesByLevel(areaSlug, stageCodeParam, { page, limit: PAGE_SIZE });
	}, [areaSlug, stageCodeParam]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLevelByCode(areaSlug, stageCodeParam),
			fetchSubStructures(1)
		])
			.then(([levelData, badgesData]) => {
				if (cancelled) return;
				setLevel(levelData);
				setBadges(badgesData.items);
				setPagination(badgesData.pagination);
				setCurrentPage(1);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [areaSlug, stageCodeParam, fetchSubStructures]);

	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		fetchSubStructures(page)
			.then((badgesData) => {
				setBadges(badgesData.items);
				setPagination(badgesData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	const handleEditSuccess = useCallback(async () => {
		try {
			const refreshed = await fetchLevelByCode(areaSlug, stageCodeParam);
			if (refreshed) setLevel(refreshed);
		} catch (error) {
			console.error(error);
		}
	}, [areaSlug, stageCodeParam]);

	const handleActivate = useCallback(async () => {
		setIsActivating(true);
		try {
			const stageCode = level?.stage_code?.stage_code;
			if (!stageCode) return;
			await activateLevel(areaSlug, stageCode);
			const refreshed = await fetchLevelByCode(areaSlug, stageCodeParam);
			if (refreshed) setLevel(refreshed);
		} catch (error) {
			console.error(error);
		} finally {
			setIsActivating(false);
		}
	}, [areaSlug, stageCodeParam, level]);

	if (loading) return <Spinner />;
	if (!level) return null;

	const stageCode = level.stage_code?.stage_code;
	const parentAreaSlug = level.area?.area_slug;
	const title = level.stage_sequence != null
		? `#${level.stage_sequence} ${level.stage_title}`
		: level.stage_title;

	const stats = [
		{
			icon: 'tabler_users',
			label: t('shared.consultants', { defaultValue: 'Consultants' }),
			value: Number(level.consultant_count || 0),
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'badge',
			label: t('structureDetail.badges', { defaultValue: 'Badges' }),
			value: Number(level.badge_count || 0),
			accentColor: '#8d640d',
			accentBg: 'rgba(210, 148, 21, 0.15)',
		},
	];

	const enrollmentMessage = level.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

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
	const parentArea = level.area;
	const parentSl = parentArea?.service_line;
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

	if (parentArea) {
		breadcrumbItems.push({
			label: parentArea.area_name,
			path: ADMIN.AREA_DETAIL.replace(':slug', parentArea.area_slug),
		});
	}

	breadcrumbItems.push({
		label: title,
		path: ADMIN.LEVEL_DETAIL.replace(':areaSlug', parentAreaSlug).replace(':stageCode', stageCode),
	});

	return (
		<>
			<StructureDetailLayout
				breadcrumbItems={breadcrumbItems}
				title={title}
				description={level.stage_description}
				icon="evolution"
				imageUrl={null}
				tone="levels"
				isActive={level.is_active}
				stats={stats}
				enrollmentMessage={enrollmentMessage}
				subStructures={subStructures}
				subStructureLabel={t('structureDetail.badges', { defaultValue: 'Badges' })}
				subStructureIcon="badge"
				subStructureTone="learningPaths"
				addSubLabel={t('structureDetail.addBadge', { defaultValue: 'Add Badge' })}
				onEdit={() => setShowEditModal(true)}
				onAddSub={() => {}}
				onDelete={level.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={!level.is_active ? handleActivate : undefined}
				isActivating={isActivating}
				onExport={() => {}}
				pagination={pagination}
				onPageChange={handlePageChange}
			/>

			{showDeleteModal && (
				<DeleteStructureModal
					entityName={level.stage_title}
					onConfirm={() => deleteLevel(areaSlug, stageCode)}
					onSuccess={async () => {
						setShowDeleteModal(false);
						try {
							const [refreshed, badgesData] = await Promise.all([
								fetchLevelByCode(areaSlug, stageCodeParam),
								fetchSubStructures(1),
							]);
							if (refreshed) setLevel(refreshed);
							setBadges(badgesData.items);
							setPagination(badgesData.pagination);
							setCurrentPage(1);
						} catch (error) {
							console.error(error);
						}
					}}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showEditModal && (
				<CreateLevelModal
					mode="edit"
					targetStageCode={stageCode}
					initialData={{
						stageTitle: level.stage_title || '',
						stageCode: stageCode || '',
						stageSequence: level.stage_sequence != null ? level.stage_sequence : '',
						stageDescription: level.stage_description || '',
					}}
					defaultAreaId={level.area_id}
					defaultAreaName={level.area?.area_name || ''}
					onSuccess={handleEditSuccess}
					onClose={() => setShowEditModal(false)}
				/>
			)}
		</>
	);
}
