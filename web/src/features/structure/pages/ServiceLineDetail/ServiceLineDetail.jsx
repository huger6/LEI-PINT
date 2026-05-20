import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import SLLeaderCard from '../../components/SLLeaderCard/SLLeaderCard';
import { fetchServiceLineBySlug, fetchAreasByServiceLine } from '../../api/structureDetailApi';
import { deleteServiceLine, activateServiceLine } from '../../api/structureListApi';
import { ADMIN } from '../../../../routes/paths';
import CreateServiceLineModal from '../../components/CreateServiceLineModal/CreateServiceLineModal';
import CreateAreaModal from '../../components/CreateAreaModal/CreateAreaModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

export default function ServiceLineDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [sl, setSl] = useState(null);
	const [areas, setAreas] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showCreateAreaModal, setShowCreateAreaModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

	const fetchSubStructures = useCallback((page) => {
		return fetchAreasByServiceLine(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchServiceLineBySlug(slug),
			fetchSubStructures(1)
		])
			.then(([slData, areasData]) => {
				if (cancelled) return;
				setSl(slData);
				setAreas(areasData.items);
				setPagination(areasData.pagination);
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
			.then((areasData) => {
				setAreas(areasData.items);
				setPagination(areasData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	const handleServiceLineEdited = useCallback(async (updated) => {
		const nextSlug = updated?.sl_slug || slug;
		try {
			const refreshed = await fetchServiceLineBySlug(nextSlug);
			if (refreshed) setSl(refreshed);
		} catch (error) {
			console.error(error);
			setSl((prev) => (prev ? {
				...prev,
				service_line_name: updated?.service_line_name ?? prev.service_line_name,
				sl_slug: updated?.sl_slug ?? prev.sl_slug,
				service_line_description: updated?.service_line_description ?? prev.service_line_description,
				img_url: updated?.img_url ?? prev.img_url,
				is_active: updated?.is_active ?? prev.is_active,
			} : prev));
		}

		if (nextSlug && nextSlug !== slug) {
			navigate(ADMIN.SERVICE_LINE_DETAIL.replace(':slug', nextSlug));
		}
	}, [slug, navigate]);

	const handleActivate = useCallback(async () => {
		setIsActivating(true);
		try {
			await activateServiceLine(slug);
			const refreshed = await fetchServiceLineBySlug(slug);
			if (refreshed) setSl(refreshed);
		} catch (error) {
			console.error(error);
		} finally {
			setIsActivating(false);
		}
	}, [slug]);

	const handleAreaCreated = useCallback(async () => {
		setCurrentPage(1);
		try {
			const [refreshedSl, areasData] = await Promise.all([
				fetchServiceLineBySlug(slug),
				fetchSubStructures(1),
			]);
			if (refreshedSl) setSl(refreshedSl);
			setAreas(areasData.items);
			setPagination(areasData.pagination);
		} catch (error) {
			console.error(error);
		}
	}, [slug, fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!sl) return null;

	const stats = [
		{
			icon: 'tabler_users',
			label: t('shared.consultants', { defaultValue: 'Consultants' }),
			value: Number(sl.consultant_count || 0),
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'area',
			label: t('shared.structureLabels.areas'),
			value: Number(sl.area_count || 0),
			accentColor: '#0f7f69',
			accentBg: 'rgba(23, 164, 136, 0.14)',
		},
	];

	const enrollmentMessage = sl.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	const subStructures = areas.map((area) => ({
		id: area.area_id,
		title: area.area_name,
		description: area.area_description,
		isActive: area.is_active,
		to: ADMIN.AREA_DETAIL.replace(':slug', area.area_slug),
		infoItems: [
			{ icon: 'tabler_users', value: Number(area.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'evolution', value: Number(area.level_count || 0), label: t('shared.levels', { defaultValue: 'Levels' }) },
		],
	}));

	const breadcrumbItems = [];
	const parentLp = sl.learning_path;

	if (parentLp) {
		breadcrumbItems.push({
			label: parentLp.path_title,
			path: ADMIN.LEARNING_PATH_DETAIL.replace(':slug', parentLp.path_slug),
		});
	}

	breadcrumbItems.push({
		label: sl.service_line_name,
		path: ADMIN.SERVICE_LINE_DETAIL.replace(':slug', slug),
	});

	return (
		<>
			<StructureDetailLayout
				breadcrumbItems={breadcrumbItems}
				title={sl.service_line_name}
				description={sl.service_line_description}
				icon="service-line"
				imageUrl={sl.img_url}
				tone="serviceLines"
				isActive={sl.is_active}
				stats={stats}
				enrollmentMessage={enrollmentMessage}
				extraContent={<SLLeaderCard leader={sl.leader} />}
				subStructures={subStructures}
				subStructureLabel={t('shared.structureLabels.areas')}
				subStructureIcon="area"
				subStructureTone="areas"
				addSubLabel={t('structureDetail.addArea', { defaultValue: 'Add Area' })}
				onEdit={() => setShowEditModal(true)}
				onAddSub={() => setShowCreateAreaModal(true)}
				onDelete={sl.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={!sl.is_active ? handleActivate : undefined}
				isActivating={isActivating}
				onExport={() => {}}
				pagination={pagination}
				onPageChange={handlePageChange}
			/>

			{showEditModal && (
				<CreateServiceLineModal
					mode="edit"
					targetSlug={sl.sl_slug || slug}
					initialData={{
						learningPathId: sl.learning_path_id || '',
						serviceLineName: sl.service_line_name || '',
						slSlug: sl.sl_slug || '',
						serviceLineDescription: sl.service_line_description || '',
						imgUrl: sl.img_url || '',
					}}
					defaultLearningPathSlug={sl.learning_path?.path_slug || null}
					onSuccess={handleServiceLineEdited}
					onClose={() => setShowEditModal(false)}
				/>
			)}

			{showDeleteModal && (
				<DeleteStructureModal
					entityName={sl.service_line_name}
					onConfirm={() => deleteServiceLine(slug)}
					onSuccess={async () => {
						setShowDeleteModal(false);
						try {
							const [refreshed, areasData] = await Promise.all([
								fetchServiceLineBySlug(slug),
								fetchSubStructures(1),
							]);
							if (refreshed) setSl(refreshed);
							setAreas(areasData.items);
							setPagination(areasData.pagination);
							setCurrentPage(1);
						} catch (error) {
							console.error(error);
						}
					}}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showCreateAreaModal && (
				<CreateAreaModal
					defaultLearningPathId={sl.learning_path_id || null}
					defaultLearningPathSlug={sl.learning_path?.path_slug || null}
					defaultServiceLineId={sl.service_line_id || null}
					defaultServiceLineSlug={sl.sl_slug || slug}
					lockLearningPath
					lockServiceLine
					onSuccess={handleAreaCreated}
					onClose={() => setShowCreateAreaModal(false)}
				/>
			)}
		</>
	);
}
