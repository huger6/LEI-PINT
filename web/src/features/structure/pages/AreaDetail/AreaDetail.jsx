import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import StructureDetailSkeleton from '../../../../components/Skeleton/StructureDetailSkeleton';
import { fetchAreaBySlug, fetchLevelsByArea } from '../../api/structureDetailApi';
import { deleteArea, activateArea } from '../../api/structureListApi';
import { ADMIN, structureDetailPaths } from '../../../../routes/paths';
import { useUser } from '../../../../hooks/userContext';
import CreateAreaModal from '../../components/CreateAreaModal/CreateAreaModal';
import CreateLevelModal from '../../components/CreateLevelModal/CreateLevelModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

// Detail page for a single Area, listing its child levels (progression stages)
export default function AreaDetail() {
	// Read the area slug from the route params
	const { slug } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { user } = useUser();
	const isAdmin = user?.role === 'Administrator';
	const P = structureDetailPaths(isAdmin);
	// The loaded area entity
	const [area, setArea] = useState(null);
	// Child levels for the current page
	const [levels, setLevels] = useState([]);
	// Pagination metadata for the levels list
	const [pagination, setPagination] = useState(null);
	// Currently selected levels page
	const [currentPage, setCurrentPage] = useState(1);
	// Whether the initial data load is in progress
	const [loading, setLoading] = useState(true);
	// Edit area modal visibility
	const [showEditModal, setShowEditModal] = useState(false);
	// Create level modal visibility
	const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
	// Delete area modal visibility
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	// Whether an activate request is in flight
	const [isActivating, setIsActivating] = useState(false);

	// Fetch a page of levels for the current area
	const fetchSubStructures = useCallback((page) => {
		return fetchLevelsByArea(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	// Load the area and its first page of levels on mount / slug change
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

	// Load a different page of levels when pagination changes
	const handlePageChange = useCallback((page) => {
		setCurrentPage(page);
		fetchSubStructures(page)
			.then((levelsData) => {
				setLevels(levelsData.items);
				setPagination(levelsData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	// Refresh the area after an edit, falling back to local merge and navigating if the slug changed
	const handleEditSuccess = useCallback(async (updated) => {
		const nextSlug = updated?.area_slug || slug;
		try {
			const refreshed = await fetchAreaBySlug(nextSlug);
			if (refreshed) setArea(refreshed);
		} catch (error) {
			console.error(error);
			setArea((prev) => (prev ? {
				...prev,
				area_name: updated?.area_name ?? prev.area_name,
				area_slug: updated?.area_slug ?? prev.area_slug,
				area_description: updated?.area_description ?? prev.area_description,
				img_url: updated?.img_url ?? prev.img_url,
				is_active: updated?.is_active ?? prev.is_active,
			} : prev));
		}

		if (nextSlug && nextSlug !== slug) {
			navigate(P.area.replace(':slug', nextSlug));
		}
	}, [slug, navigate]);

	// Reload the area and first page of levels after creating a level
	const handleLevelCreated = useCallback(async () => {
		setCurrentPage(1);
		try {
			const [refreshedArea, levelsData] = await Promise.all([
				fetchAreaBySlug(slug),
				fetchSubStructures(1),
			]);
			if (refreshedArea) setArea(refreshedArea);
			setLevels(levelsData.items);
			setPagination(levelsData.pagination);
		} catch (error) {
			console.error(error);
		}
	}, [slug, fetchSubStructures]);

	// Activate the area and refresh it
	const handleActivate = useCallback(async () => {
		setIsActivating(true);
		try {
			await activateArea(slug);
			const refreshed = await fetchAreaBySlug(slug);
			if (refreshed) setArea(refreshed);
		} catch (error) {
			console.error(error);
		} finally {
			setIsActivating(false);
		}
	}, [slug]);

	if (loading) return <StructureDetailSkeleton />;
	if (!area) return null;

	// Summary stat cards shown in the detail header
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

	// Optional message shown when the current user is enrolled
	const enrollmentMessage = area.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	// Map levels into the generic sub-structure card shape used by the layout
	const subStructures = levels.map((level) => ({
		id: level.progression_stage_id,
		title: level.stage_title,
		description: level.stage_description,
		isActive: level.is_active,
		count: level.stage_sequence != null ? `#${level.stage_sequence}` : undefined,
		to: P.level.replace(':areaSlug', area.area_slug).replace(':stageCode', level.stage_code?.stage_code),
		infoItems: [
			{ icon: 'tabler_users', value: Number(level.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'badge', value: level.has_badge ? t('shared.yes', { defaultValue: 'Yes' }) : t('shared.no', { defaultValue: 'No' }), label: t('shared.badge', { defaultValue: 'Badge' }) },
		],
	}));

	// Build breadcrumb trail from the parent hierarchy (learning path > service line > area)
	const breadcrumbItems = [];
	const parentSl = area.service_line;
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

	breadcrumbItems.push({
		label: area.area_name,
		path: P.area.replace(':slug', slug),
	});

	return (
		<>
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
				canManage={isAdmin}
				onEdit={isAdmin ? () => setShowEditModal(true) : undefined}
				onAddSub={isAdmin ? () => setShowCreateLevelModal(true) : undefined}
				onDelete={isAdmin && area.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={isAdmin && !area.is_active ? handleActivate : undefined}
				isActivating={isActivating}
				onExport={() => {}}
				exportType="area"
				exportId={area.area_slug || slug}
				pagination={pagination}
				onPageChange={handlePageChange}
			/>

			{showDeleteModal && (
				<DeleteStructureModal
					entityName={area.area_name}
					onConfirm={() => deleteArea(slug)}
					onSuccess={async () => {
						setShowDeleteModal(false);
						try {
							const [refreshed, levelsData] = await Promise.all([
								fetchAreaBySlug(slug),
								fetchSubStructures(1),
							]);
							if (refreshed) setArea(refreshed);
							setLevels(levelsData.items);
							setPagination(levelsData.pagination);
							setCurrentPage(1);
						} catch (error) {
							console.error(error);
						}
					}}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showCreateLevelModal && (
				<CreateLevelModal
					defaultAreaId={area.area_id}
					defaultAreaName={area.area_name}
					onSuccess={handleLevelCreated}
					onClose={() => setShowCreateLevelModal(false)}
				/>
			)}

			{showEditModal && (
				<CreateAreaModal
					mode="edit"
					targetSlug={area.area_slug || slug}
					initialData={{
						learningPathId: area.service_line?.learning_path?.learning_path_id || '',
						serviceLineId: area.service_line_id || '',
						areaName: area.area_name || '',
						areaSlug: area.area_slug || '',
						areaDescription: area.area_description || '',
						imgUrl: area.img_url || '',
					}}
					defaultLearningPathSlug={area.service_line?.learning_path?.path_slug || null}
					defaultServiceLineSlug={area.service_line?.sl_slug || null}
					onSuccess={handleEditSuccess}
					onClose={() => setShowEditModal(false)}
				/>
			)}
		</>
	);
}
