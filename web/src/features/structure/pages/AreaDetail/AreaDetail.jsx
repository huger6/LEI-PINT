import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import StructureDetailSkeleton from '../../../../components/Skeleton/StructureDetailSkeleton';
import { fetchAreaBySlug, fetchLevelsByArea } from '../../api/structureDetailApi';
import { deleteArea, activateArea } from '../../api/structureListApi';
import { ADMIN } from '../../../../routes/paths';
import CreateAreaModal from '../../components/CreateAreaModal/CreateAreaModal';
import CreateLevelModal from '../../components/CreateLevelModal/CreateLevelModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

export default function AreaDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [area, setArea] = useState(null);
	const [levels, setLevels] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showCreateLevelModal, setShowCreateLevelModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

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
			navigate(ADMIN.AREA_DETAIL.replace(':slug', nextSlug));
		}
	}, [slug, navigate]);

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
		count: level.stage_sequence != null ? `#${level.stage_sequence}` : undefined,
		to: ADMIN.LEVEL_DETAIL.replace(':areaSlug', area.area_slug).replace(':stageCode', level.stage_code?.stage_code),
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
				onEdit={() => setShowEditModal(true)}
				onAddSub={() => setShowCreateLevelModal(true)}
				onDelete={area.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={!area.is_active ? handleActivate : undefined}
				isActivating={isActivating}
				onExport={() => {}}
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
