import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import StructureDetailSkeleton from '../../../../components/Skeleton/StructureDetailSkeleton';
import { fetchLevelByCode, fetchBadgesByLevel } from '../../api/structureDetailApi';
import { deleteLevel, activateLevel } from '../../api/structureListApi';
import { ADMIN, SHARED, structureDetailPaths } from '../../../../routes/paths';
import { useUser } from '../../../../hooks/userContext';
import CreateLevelModal from '../../components/CreateLevelModal/CreateLevelModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

// Detail page for a single level (progression stage), listing its child badges
export default function LevelDetail() {
	// Read the parent area slug and stage code from the route params
	const { areaSlug, stageCode: stageCodeParam } = useParams();
	const { t } = useTranslation();
	const { user } = useUser();
	const isAdmin = user?.role === 'Administrator';
	const P = structureDetailPaths(isAdmin);
	// The loaded level entity
	const [level, setLevel] = useState(null);
	// Child badges for the current page
	const [badges, setBadges] = useState([]);
	// Pagination metadata for the badges list
	const [pagination, setPagination] = useState(null);
	// Currently selected badges page
	const [currentPage, setCurrentPage] = useState(1);
	// Whether the initial data load is in progress
	const [loading, setLoading] = useState(true);
	// Edit level modal visibility
	const [showEditModal, setShowEditModal] = useState(false);
	// Delete level modal visibility
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	// Whether an activate request is in flight
	const [isActivating, setIsActivating] = useState(false);

	// Fetch a page of badges for the current level
	const fetchSubStructures = useCallback((page) => {
		return fetchBadgesByLevel(areaSlug, stageCodeParam, { page, limit: PAGE_SIZE });
	}, [areaSlug, stageCodeParam]);

	// Load the level and its first page of badges on mount / param change
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

	// Load a different page of badges when pagination changes
	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		fetchSubStructures(page)
			.then((badgesData) => {
				setBadges(badgesData.items);
				setPagination(badgesData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	// Refresh the level after a successful edit
	const handleEditSuccess = useCallback(async () => {
		try {
			const refreshed = await fetchLevelByCode(areaSlug, stageCodeParam);
			if (refreshed) setLevel(refreshed);
		} catch (error) {
			console.error(error);
		}
	}, [areaSlug, stageCodeParam]);

	// Activate the level and refresh it
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

	if (loading) return <StructureDetailSkeleton />;
	if (!level) return null;

	// Derive the stage code, parent area slug, and display title from the level
	const stageCode = level.stage_code?.stage_code;
	const parentAreaSlug = level.area?.area_slug;
	const title = level.stage_sequence != null
		? `#${level.stage_sequence} ${level.stage_title}`
		: level.stage_title;

	// Summary stat cards shown in the detail header
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
			label: t('structureDetail.badge', { defaultValue: 'Badge' }),
			value: level.has_badge ? t('shared.yes', { defaultValue: 'Yes' }) : t('shared.no', { defaultValue: 'No' }),
			accentColor: '#8d640d',
			accentBg: 'rgba(210, 148, 21, 0.15)',
		},
	];

	// Optional message shown when the current user is enrolled
	const enrollmentMessage = level.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	// Map badges into the generic sub-structure card shape used by the layout
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

	// Build breadcrumb trail from the parent hierarchy (learning path > service line > area > level)
	const breadcrumbItems = [];
	const parentArea = level.area;
	const parentSl = parentArea?.service_line;
	const parentLp = parentSl?.learning_path;

	if (parentLp) {
		breadcrumbItems.push({
			label: parentLp.path_title,
			path: P.lp.replace(':slug', parentLp.path_slug),
		});
	}

	if (parentSl) {
		breadcrumbItems.push({
			label: parentSl.service_line_name,
			path: P.sl.replace(':slug', parentSl.sl_slug),
		});
	}

	if (parentArea) {
		breadcrumbItems.push({
			label: parentArea.area_name,
			path: P.area.replace(':slug', parentArea.area_slug),
		});
	}

	breadcrumbItems.push({
		label: title,
		path: P.level.replace(':areaSlug', parentAreaSlug).replace(':stageCode', stageCode),
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
				canManage={isAdmin}
				onEdit={isAdmin ? () => setShowEditModal(true) : undefined}
				onAddSub={isAdmin ? () => {} : undefined}
				onDelete={isAdmin && level.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={isAdmin && !level.is_active ? handleActivate : undefined}
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
