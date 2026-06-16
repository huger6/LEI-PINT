import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadges, createBadge, updateBadge, deleteBadge } from '../../../features/badges/api/badgesApi';
import { getAreas, getLevels, getLearningPaths, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import BadgeImagePicker from '../../../components/BadgeImagePicker/BadgeImagePicker';
import styles from './AdminBadges.module.css';

const BADGE_TYPES = ['Standard', 'Special'];

const emptyForm = {
	badgeTitle: '',
	learningPathId: '',
	serviceLineId: '',
	areaId: '',
	progressionStageId: '',
	badgeType: 'Standard',
	badgePoints: 0,
	expirationDurationDays: '',
	badgeImgUrl: '',
	badgeDescription: '',
	isActive: true,
};

const idEq = (a, b) => a != null && b != null && String(a) === String(b);

export default function AdminBadges() {
	const { t } = useTranslation();
	const [badges, setBadges] = useState([]);
	const [learningPaths, setLearningPaths] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);
	const [allLevels, setAllLevels] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);
	const [imageUploading, setImageUploading] = useState(false);

	async function loadData() {
		try {
			setLoading(true);
			const [badgeData, lpData, slData, areaData, levelData] = await Promise.all([
				getBadges(), getLearningPaths(), getServiceLines(), getAreas(), getLevels(),
			]);
			setBadges(badgeData.data || badgeData || []);
			setLearningPaths(lpData.data || lpData || []);
			setServiceLines(slData.data || slData || []);
			setAreas(areaData.data || areaData || []);
			setAllLevels(levelData.data || levelData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { loadData(); }, []);

	function getAreaName(areaId) {
		const area = areas.find((a) => idEq(a.area_id ?? a.areaId, areaId));
		return area ? (area.area_name || area.areaName) : '—';
	}

	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(item) {
		setEditItem(item);
		setForm({
			badgeTitle: item.badge_title || item.badgeTitle || '',
			learningPathId: item.learning_path_id ?? item.learningPathId ?? '',
			serviceLineId: item.service_line_id ?? item.serviceLineId ?? '',
			areaId: item.area_id || item.areaId || '',
			progressionStageId: item.progression_stage_id || item.progressionStageId || '',
			badgeType: item.badge_type || item.badgeType || 'Standard',
			badgePoints: item.badge_points || item.badgePoints || 0,
			expirationDurationDays: item.expiration_duration_days ?? item.expirationDurationDays ?? '',
			badgeImgUrl: item.badge_img_url || item.badgeImgUrl || '',
			badgeDescription: item.badge_description || item.badgeDescription || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(item) {
		if (!window.confirm(t('shared.confirmDelete', { name: item.badge_title || item.badgeTitle }))) return;
		try {
			await deleteBadge(item.badge_slug || item.badgeSlug);
			setBadges((prev) => prev.filter((b) => b.badge_slug !== item.badge_slug));
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (imageUploading) return;
		setSaving(true);
		try {
			const expiration = form.expirationDurationDays === '' || form.expirationDurationDays === null
				? null
				: Number(form.expirationDurationDays);
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
			if (editItem) {
				const updated = await updateBadge(editItem.badge_slug || editItem.badgeSlug, payload);
				setBadges((prev) => prev.map((b) => (b.badge_slug === editItem.badge_slug ? updated : b)));
			} else {
				const created = await createBadge(payload);
				setBadges((prev) => [...prev, created]);
			}
			setShowModal(false);
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	}

	// Cascade: each level of the hierarchy is filtered by the parent selection.
	const slOptions = useMemo(
		() => serviceLines.filter((sl) => idEq(sl.learning_path_id ?? sl.learningPathId, form.learningPathId)),
		[serviceLines, form.learningPathId],
	);
	const areaOptions = useMemo(
		() => areas.filter((a) => idEq(a.service_line_id ?? a.serviceLineId, form.serviceLineId)),
		[areas, form.serviceLineId],
	);

	const takenStageIds = useMemo(() => badges
		.filter((b) => {
			const stageId = b.progression_stage_id || b.progressionStageId;
			if (!stageId) return false;
			if (editItem) {
				const editStageId = editItem.progression_stage_id || editItem.progressionStageId;
				return !idEq(stageId, editStageId);
			}
			return true;
		})
		.map((b) => b.progression_stage_id || b.progressionStageId), [badges, editItem]);

	const availableLevels = useMemo(() => allLevels.filter((l) => {
		const levelAreaId = l.area_id || l.areaId;
		if (!idEq(levelAreaId, form.areaId)) return false;
		const stageId = l.progression_stage_id || l.progressionStageId;
		return !takenStageIds.includes(stageId);
	}), [allLevels, form.areaId, takenStageIds]);

	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => {
			const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
			// Reset descendants when an ancestor changes.
			if (name === 'learningPathId') { next.serviceLineId = ''; next.areaId = ''; next.progressionStageId = ''; }
			if (name === 'serviceLineId') { next.areaId = ''; next.progressionStageId = ''; }
			if (name === 'areaId') { next.progressionStageId = ''; }
			return next;
		});
	}

	const filteredBadges = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return badges;
		return badges.filter((b) => (b.badge_title || b.badgeTitle || '').toLowerCase().includes(term));
	}, [badges, search]);

	return (
		<div>
			<div className={styles.header}>
				<div className={styles.headerIcon}><Icon name="badge" size={24} aria-hidden="true" /></div>
				<div className={styles.headerText}>
					<h1 className={styles.title}>{t('adminBadges.title')}</h1>
					<p className={styles.subtitle}>{t('adminBadges.subtitle')}</p>
				</div>
				<Button onClick={openCreate}>
					<Icon name="add" size={16} aria-hidden="true" className="me-1" />
					{t('adminBadges.newBadge')}
				</Button>
			</div>

			{!loading && badges.length > 0 && (
				<div className={styles.toolbar}>
					<FilterSearchInput
						name="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t('adminBadges.searchPlaceholder')}
						ariaLabel={t('adminBadges.searchPlaceholder')}
					/>
				</div>
			)}

			{loading ? (
				<CardGridSkeleton count={8} />
			) : badges.length === 0 ? (
				<div className={styles.empty}>
					<Icon name="badge" size={40} aria-hidden="true" className={styles.emptyIcon} />
					<h5 className="text-muted mb-0">{t('adminBadges.noBadges')}</h5>
					<p className="text-muted small">{t('adminBadges.noBadgesDesc')}</p>
				</div>
			) : (
				<div className={styles.grid}>
					{filteredBadges.map((b) => {
						const img = b.badge_img_url || b.badgeImgUrl;
						const isSpecial = (b.badge_type || b.badgeType) === 'Special';
						const active = b.is_active;
						return (
							<article key={b.badge_slug || b.badgeSlug} className={`${styles.card} ${!active ? styles.cardInactive : ''}`}>
								<div className={`${styles.thumb} ${isSpecial ? styles.thumbSpecial : ''}`}>
									{img ? <img src={img} alt="" /> : <Icon name="badge" size={36} aria-hidden="true" />}
									{isSpecial && <span className={styles.premiumTag}>{t('badgeCatalog.filters.class.special', { defaultValue: 'Premium' })}</span>}
								</div>
								<div className={styles.cardBody}>
									<h3 className={styles.cardTitle} title={b.badge_title || b.badgeTitle}>{b.badge_title || b.badgeTitle}</h3>
									<span className={styles.cardArea}>{getAreaName(b.area_id || b.areaId)}</span>
									<div className={styles.cardMeta}>
										<span className={styles.points}>
											<Icon name="star-points" size={13} aria-hidden="true" /> {b.badge_points || b.badgePoints} pts
										</span>
										<span className={`${styles.status} ${active ? styles.statusOn : styles.statusOff}`}>
											{active ? t('shared.active') : t('shared.inactive')}
										</span>
									</div>
								</div>
								<div className={styles.cardActions}>
									<Tooltip text={t('shared.edit')}>
										<Button size="sm" variant="outlined" aria-label={t('shared.edit')} onClick={() => openEdit(b)}>
											<Icon name="pencil" size={14} aria-hidden="true" />
										</Button>
									</Tooltip>
									<Tooltip text={t('shared.delete')}>
										<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.delete')} onClick={() => handleDelete(b)}>
											<Icon name="trash" size={14} aria-hidden="true" />
										</Button>
									</Tooltip>
								</div>
							</article>
						);
					})}
				</div>
			)}

			{showModal && (
				<Modal
					title={editItem ? t('adminBadges.editBadge') : t('adminBadges.newBadge')}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setShowModal(false)}>{t('shared.cancel')}</Button>
							<Button loading={saving} disabled={imageUploading} onClick={handleSubmit}>
								{editItem ? t('shared.save') : t('shared.create')}
							</Button>
						</>
					}
				>
					<form id="badge-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput label={t('shared.title')} name="badgeTitle" value={form.badgeTitle} onChange={handleChange} required />

						{/* Hierarchy cascade: LP -> SL -> Area -> Level */}
						<div>
							<label htmlFor="badge_lp" className="form-label">{t('adminBadges.learningPath')}</label>
							<select id="badge_lp" className="form-select" name="learningPathId" value={form.learningPathId} onChange={handleChange} required>
								<option value="">{t('shared.select')}</option>
								{learningPaths.map((lp) => (
									<option key={lp.learning_path_id || lp.learningPathId} value={lp.learning_path_id || lp.learningPathId}>
										{lp.path_title || lp.pathTitle}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="badge_sl" className="form-label">{t('adminBadges.serviceLine')}</label>
							<select id="badge_sl" className="form-select" name="serviceLineId" value={form.serviceLineId} onChange={handleChange} disabled={!form.learningPathId} required>
								<option value="">{form.learningPathId ? t('shared.select') : t('adminBadges.selectLpFirst')}</option>
								{slOptions.map((sl) => (
									<option key={sl.service_line_id || sl.serviceLineId} value={sl.service_line_id || sl.serviceLineId}>
										{sl.service_line_name || sl.serviceLineName}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="badge_area" className="form-label">{t('shared.area')}</label>
							<select id="badge_area" className="form-select" name="areaId" value={form.areaId} onChange={handleChange} disabled={!form.serviceLineId} required>
								<option value="">{form.serviceLineId ? t('shared.select') : t('adminBadges.selectSlFirst')}</option>
								{areaOptions.map((a) => (
									<option key={a.area_slug || a.areaSlug} value={a.area_id || a.areaId}>
										{a.area_name || a.areaName}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="badge_level" className="form-label">{t('adminBadges.level')}</label>
							<select id="badge_level" className="form-select" name="progressionStageId" value={form.progressionStageId} onChange={handleChange} disabled={!form.areaId} required>
								<option value="">{form.areaId ? t('shared.select') : t('adminBadges.selectAreaFirst')}</option>
								{availableLevels.map((l) => (
									<option key={l.progression_stage_id || l.progressionStageId} value={l.progression_stage_id || l.progressionStageId}>
										{l.stage_title || l.stageTitle}{l.stage_code?.stage_code ? ` (${l.stage_code.stage_code})` : ''}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="badge_type" className="form-label">{t('shared.type')}</label>
							<select id="badge_type" className="form-select" name="badgeType" value={form.badgeType} onChange={handleChange}>
								{BADGE_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
							</select>
						</div>
						<FormInput label={t('shared.points')} name="badgePoints" type="number" value={form.badgePoints} onChange={handleChange} min={0} />
						<FormInput
							label={t('adminBadges.expirationDays')}
							name="expirationDurationDays"
							type="number"
							value={form.expirationDurationDays}
							onChange={handleChange}
							min={1}
							placeholder={t('adminBadges.expirationNever')}
						/>
						<BadgeImagePicker
							label={t('adminBadges.image')}
							value={form.badgeImgUrl}
							onChange={(url) => setForm((prev) => ({ ...prev, badgeImgUrl: url }))}
							onUploadingChange={setImageUploading}
						/>
						<div>
							<label htmlFor="badge_desc" className="form-label">{t('shared.description')}</label>
							<textarea id="badge_desc" className="form-control" name="badgeDescription" rows={3} value={form.badgeDescription} onChange={handleChange} />
						</div>
						<div className="form-check">
							<input className="form-check-input" type="checkbox" name="isActive" id="badge_active" checked={form.isActive} onChange={handleChange} />
							<label className="form-check-label" htmlFor="badge_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
