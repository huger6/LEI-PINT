import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBadges, getBadgeBySlug, createBadge, updateBadge } from '../../../features/badges/api/badgesApi';
import { getAreas, getLevels, getLearningPaths, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { ADMIN } from '../../../routes/paths';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import BadgeImagePicker from '../../../components/BadgeImagePicker/BadgeImagePicker';
import DetailPageSkeleton from '../../../components/Skeleton/DetailPageSkeleton';
import styles from './AdminBadgeForm.module.css';

const BADGE_TYPES = ['Standard', 'Special'];
const idEq = (a, b) => a != null && b != null && String(a) === String(b);

const emptyForm = {
	badgeTitle: '', learningPathId: '', serviceLineId: '', areaId: '', progressionStageId: '',
	badgeType: 'Standard', badgePoints: 0, expirationDurationDays: '', badgeImgUrl: '', badgeDescription: '', isActive: true,
};

export default function AdminBadgeForm() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { slug } = useParams();
	const isEdit = Boolean(slug);

	const [form, setForm] = useState(emptyForm);
	const [learningPaths, setLearningPaths] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);
	const [allLevels, setAllLevels] = useState([]);
	const [badges, setBadges] = useState([]);
	const [editItem, setEditItem] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [imageUploading, setImageUploading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const [lp, sl, area, lvl, bdgs, current] = await Promise.all([
					getLearningPaths(), getServiceLines(), getAreas(), getLevels(), getBadges(),
					isEdit ? getBadgeBySlug(slug) : Promise.resolve(null),
				]);
				setLearningPaths(lp.data || lp || []);
				setServiceLines(sl.data || sl || []);
				setAreas(area.data || area || []);
				setAllLevels(lvl.data || lvl || []);
				setBadges(bdgs.data || bdgs || []);
				if (isEdit && current) {
					setEditItem(current);
					setForm({
						badgeTitle: current.badge_title || '',
						learningPathId: current.learning_path_id ?? '',
						serviceLineId: current.service_line_id ?? '',
						areaId: current.area_id ?? '',
						progressionStageId: current.progression_stage_id ?? '',
						badgeType: current.badge_type || 'Standard',
						badgePoints: current.badge_points || 0,
						expirationDurationDays: current.expiration_duration_days ?? '',
						badgeImgUrl: current.badge_img_url || '',
						badgeDescription: current.badge_description || '',
						isActive: current.is_active ?? true,
					});
				}
			} catch (err) {
				console.error(err);
				setError(t('adminBadgeForm.loadFailed'));
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [slug]);

	const slOptions = useMemo(
		() => serviceLines.filter((sl) => idEq(sl.learning_path_id, form.learningPathId)),
		[serviceLines, form.learningPathId],
	);
	const areaOptions = useMemo(
		() => areas.filter((a) => idEq(a.service_line_id, form.serviceLineId)),
		[areas, form.serviceLineId],
	);
	const takenStageIds = useMemo(() => badges
		.filter((b) => {
			const stageId = b.progression_stage_id;
			if (!stageId) return false;
			return editItem ? !idEq(stageId, editItem.progression_stage_id) : true;
		})
		.map((b) => b.progression_stage_id), [badges, editItem]);
	const levelOptions = useMemo(() => allLevels.filter((l) => {
		if (!idEq(l.area_id, form.areaId)) return false;
		return !takenStageIds.includes(l.progression_stage_id || l.progressionStageId);
	}), [allLevels, form.areaId, takenStageIds]);

	function setField(name, value) {
		setForm((prev) => {
			const next = { ...prev, [name]: value };
			if (name === 'learningPathId') { next.serviceLineId = ''; next.areaId = ''; next.progressionStageId = ''; }
			if (name === 'serviceLineId') { next.areaId = ''; next.progressionStageId = ''; }
			if (name === 'areaId') { next.progressionStageId = ''; }
			return next;
		});
	}
	function handleInput(e) {
		const { name, value, type, checked } = e.target;
		setField(name, type === 'checkbox' ? checked : value);
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (imageUploading) return;
		setSaving(true);
		setError('');
		try {
			const expiration = form.expirationDurationDays === '' || form.expirationDurationDays === null
				? null : Number(form.expirationDurationDays);
			const payload = {
				badgeTitle: form.badgeTitle,
				areaId: Number(form.areaId) || form.areaId,
				progressionStageId: Number(form.progressionStageId) || form.progressionStageId,
				badgeType: form.badgeType,
				badgePoints: Number(form.badgePoints),
				expirationDurationDays: expiration,
				badgeImgUrl: form.badgeImgUrl || null,
				badgeDescription: form.badgeDescription,
				isActive: form.isActive,
			};
			if (isEdit) await updateBadge(editItem.badge_slug || slug, payload);
			else await createBadge(payload);
			navigate(ADMIN.BADGES);
		} catch (err) {
			console.error(err);
			setError(t('adminBadgeForm.saveFailed'));
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <DetailPageSkeleton />;

	return (
		<div className={styles.page}>
			<nav className={styles.breadcrumb} aria-label="breadcrumb">
				<Link to={ADMIN.BADGES} className={styles.breadcrumbLink}>{t('adminBadges.title')}</Link>
				<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				<span>{isEdit ? t('adminBadges.editBadge') : t('adminBadges.newBadge')}</span>
			</nav>

			<h1 className="h3 mb-4">{isEdit ? t('adminBadges.editBadge') : t('adminBadges.newBadge')}</h1>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<form onSubmit={handleSubmit} className={styles.formCard}>
				<FormInput label={t('shared.title')} name="badgeTitle" value={form.badgeTitle} onChange={handleInput} required />

				<div className={styles.row}>
					<div>
						<label className="form-label">{t('adminBadges.learningPath')}</label>
						<CustomSelect name="learningPathId" value={String(form.learningPathId || '')} onChange={handleInput}
							ariaLabel={t('adminBadges.learningPath')}
							options={[{ value: '', label: t('shared.select') }, ...learningPaths.map((lp) => ({ value: String(lp.learning_path_id), label: lp.path_title }))]} />
					</div>
					<div>
						<label className="form-label">{t('adminBadges.serviceLine')}</label>
						<CustomSelect name="serviceLineId" value={String(form.serviceLineId || '')} onChange={handleInput} disabled={!form.learningPathId}
							ariaLabel={t('adminBadges.serviceLine')}
							options={[{ value: '', label: form.learningPathId ? t('shared.select') : t('adminBadges.selectLpFirst') }, ...slOptions.map((sl) => ({ value: String(sl.service_line_id), label: sl.service_line_name }))]} />
					</div>
					<div>
						<label className="form-label">{t('shared.area')}</label>
						<CustomSelect name="areaId" value={String(form.areaId || '')} onChange={handleInput} disabled={!form.serviceLineId}
							ariaLabel={t('shared.area')}
							options={[{ value: '', label: form.serviceLineId ? t('shared.select') : t('adminBadges.selectSlFirst') }, ...areaOptions.map((a) => ({ value: String(a.area_id), label: a.area_name }))]} />
					</div>
					<div>
						<label className="form-label">{t('adminBadges.level')}</label>
						<CustomSelect name="progressionStageId" value={String(form.progressionStageId || '')} onChange={handleInput} disabled={!form.areaId}
							ariaLabel={t('adminBadges.level')}
							options={[{ value: '', label: form.areaId ? t('shared.select') : t('adminBadges.selectAreaFirst') }, ...levelOptions.map((l) => ({ value: String(l.progression_stage_id || l.progressionStageId), label: `${l.stage_title || l.stageTitle}${l.stage_code?.stage_code ? ` (${l.stage_code.stage_code})` : ''}` }))]} />
					</div>
				</div>

				<div className={styles.row}>
					<div>
						<label className="form-label">{t('shared.type')}</label>
						<CustomSelect name="badgeType" value={form.badgeType} onChange={handleInput} ariaLabel={t('shared.type')}
							options={BADGE_TYPES.map((tp) => ({ value: tp, label: tp }))} />
					</div>
					<FormInput label={t('shared.points')} name="badgePoints" type="number" min={0} value={form.badgePoints} onChange={handleInput} />
					<FormInput label={t('adminBadges.expirationDays')} name="expirationDurationDays" type="number" min={1}
						value={form.expirationDurationDays} onChange={handleInput} placeholder={t('adminBadges.expirationNever')} />
				</div>

				<BadgeImagePicker
					label={t('adminBadges.image')}
					value={form.badgeImgUrl}
					onChange={(url) => setForm((prev) => ({ ...prev, badgeImgUrl: url }))}
					onUploadingChange={setImageUploading}
				/>

				<div>
					<label htmlFor="badge_desc" className="form-label">{t('shared.description')}</label>
					<textarea id="badge_desc" className="form-control" name="badgeDescription" rows={3} value={form.badgeDescription} onChange={handleInput} />
				</div>

				<div className="form-check">
					<input className="form-check-input" type="checkbox" name="isActive" id="badge_active" checked={form.isActive} onChange={handleInput} />
					<label className="form-check-label" htmlFor="badge_active">{t('shared.active')}</label>
				</div>

				<div className={styles.actions}>
					<Button type="button" variant="outlined" onClick={() => navigate(ADMIN.BADGES)}>{t('shared.cancel')}</Button>
					<Button type="submit" loading={saving} disabled={imageUploading}>{isEdit ? t('shared.save') : t('shared.create')}</Button>
				</div>
			</form>
		</div>
	);
}
