import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';
import Spinner from '../../../../components/Spinner/Spinner';
import { fetchLearningPathBySlug, fetchServiceLinesByLearningPath } from '../../api/structureDetailApi';
import { deleteLearningPath, activateLearningPath } from '../../api/structureListApi';
import { ADMIN } from '../../../../routes/paths';
import CreateLearningPathModal from '../../components/CreateLearningPathModal/CreateLearningPathModal';
import CreateServiceLineModal from '../../components/CreateServiceLineModal/CreateServiceLineModal';
import DeleteStructureModal from '../../components/DeleteStructureModal/DeleteStructureModal';

const PAGE_SIZE = 32;

export default function LearningPathDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [lp, setLp] = useState(null);
	const [serviceLines, setServiceLines] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showCreateServiceLineModal, setShowCreateServiceLineModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

	const fetchSubStructures = useCallback((page) => {
		return fetchServiceLinesByLearningPath(slug, { page, limit: PAGE_SIZE });
	}, [slug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			fetchLearningPathBySlug(slug),
			fetchSubStructures(1)
		])
			.then(([lpData, slData]) => {
				if (cancelled) return;
				setLp(lpData);
				setServiceLines(slData.items);
				setPagination(slData.pagination);
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
			.then((slData) => {
				setServiceLines(slData.items);
				setPagination(slData.pagination);
			})
			.catch(console.error);
	}, [fetchSubStructures]);

	const handleEditSuccess = useCallback(async (updated) => {
		const nextSlug = updated?.path_slug || slug;
		try {
			const refreshed = await fetchLearningPathBySlug(nextSlug);
			if (refreshed) setLp(refreshed);
		} catch (error) {
			console.error(error);
			setLp((prev) => (prev ? {
				...prev,
				path_title: updated?.path_title ?? prev.path_title,
				path_slug: updated?.path_slug ?? prev.path_slug,
				path_description: updated?.path_description ?? prev.path_description,
				img_url: updated?.img_url ?? prev.img_url,
				is_active: updated?.is_active ?? prev.is_active,
			} : prev));
		}

		if (nextSlug && nextSlug !== slug) {
			navigate(ADMIN.LEARNING_PATH_DETAIL.replace(':slug', nextSlug));
		}
	}, [slug, navigate]);

	const handleActivate = useCallback(async () => {
		setIsActivating(true);
		try {
			await activateLearningPath(slug);
			const refreshed = await fetchLearningPathBySlug(slug);
			if (refreshed) setLp(refreshed);
		} catch (error) {
			console.error(error);
		} finally {
			setIsActivating(false);
		}
	}, [slug]);

	const handleServiceLineCreated = useCallback(async () => {
		setCurrentPage(1);
		try {
			const [refreshedLp, slData] = await Promise.all([
				fetchLearningPathBySlug(slug),
				fetchSubStructures(1),
			]);
			if (refreshedLp) setLp(refreshedLp);
			setServiceLines(slData.items);
			setPagination(slData.pagination);
		} catch (error) {
			console.error(error);
		}
	}, [slug, fetchSubStructures]);

	if (loading) return <Spinner />;
	if (!lp) return null;

	const stats = [
		{
			icon: 'tabler_users',
			label: t('shared.consultants', { defaultValue: 'Consultants' }),
			value: Number(lp.consultant_count || 0),
			accentColor: 'var(--color-primary)',
			accentBg: 'var(--color-primary-soft)',
		},
		{
			icon: 'service-line',
			label: t('shared.structureLabels.serviceLines'),
			value: Number(lp.service_line_count || 0),
			accentColor: '#274f82',
			accentBg: 'rgba(57, 99, 156, 0.17)',
		},
	];

	const enrollmentMessage = lp.is_enrolled
		? t('structureDetail.enrolled', { defaultValue: 'You are enrolled in this structure' })
		: null;

	const subStructures = serviceLines.map((sl) => ({
		id: sl.service_line_id,
		title: sl.service_line_name,
		description: sl.service_line_description,
		isActive: sl.is_active,
		to: ADMIN.SERVICE_LINE_DETAIL.replace(':slug', sl.sl_slug),
		infoItems: [
			{ icon: 'tabler_users', value: Number(sl.consultant_count || 0), label: t('shared.consultants', { defaultValue: 'Consultants' }) },
			{ icon: 'area', value: Number(sl.area_count || 0), label: t('shared.areas', { defaultValue: 'Areas' }) },
		],
	}));

	const breadcrumbItems = [
		{
			label: lp.path_title,
			path: ADMIN.LEARNING_PATH_DETAIL.replace(':slug', slug),
		},
	];

	return (
		<>
			<StructureDetailLayout
				breadcrumbItems={breadcrumbItems}
				title={lp.path_title}
				description={lp.path_description}
				icon="learning-path"
				imageUrl={lp.img_url}
				tone="learningPaths"
				isActive={lp.is_active}
				stats={stats}
				enrollmentMessage={enrollmentMessage}
				subStructures={subStructures}
				subStructureLabel={t('shared.structureLabels.serviceLines')}
				subStructureIcon="service-line"
				subStructureTone="serviceLines"
				addSubLabel={t('structureDetail.addServiceLine', { defaultValue: 'Add Service Line' })}
				onEdit={() => setShowEditModal(true)}
				onAddSub={() => setShowCreateServiceLineModal(true)}
				onDelete={lp.is_active ? () => setShowDeleteModal(true) : undefined}
				onActivate={!lp.is_active ? handleActivate : undefined}
				isActivating={isActivating}
				onExport={() => {}}
				pagination={pagination}
				onPageChange={handlePageChange}
			/>

			{showEditModal && (
				<CreateLearningPathModal
					mode="edit"
					targetSlug={lp.path_slug || slug}
					initialData={{
						pathTitle: lp.path_title || '',
						pathSlug: lp.path_slug || '',
						pathDescription: lp.path_description || '',
						imgUrl: lp.img_url || '',
					}}
					onSuccess={handleEditSuccess}
					onClose={() => setShowEditModal(false)}
				/>
			)}

			{showDeleteModal && (
				<DeleteStructureModal
					entityName={lp.path_title}
					onConfirm={() => deleteLearningPath(slug)}
					onSuccess={async () => {
						setShowDeleteModal(false);
						try {
							const refreshed = await fetchLearningPathBySlug(slug);
							if (refreshed) setLp(refreshed);
						} catch (error) {
							console.error(error);
						}
					}}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showCreateServiceLineModal && (
				<CreateServiceLineModal
					defaultLearningPathId={lp.learning_path_id || null}
					defaultLearningPathSlug={lp.path_slug || slug}
					lockLearningPath
					onSuccess={handleServiceLineCreated}
					onClose={() => setShowCreateServiceLineModal(false)}
				/>
			)}
		</>
	);
}
