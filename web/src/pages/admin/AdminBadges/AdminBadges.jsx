import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadges, createBadge, updateBadge, deleteBadge } from '../../../features/badges/api/badgesApi';
import { getAreas } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';

const BADGE_TYPES = ['Standard', 'Special'];

const emptyForm = {
	badgeTitle: '',
	areaId: '',
	progressionStageId: '',
	badgeType: 'Standard',
	badgePoints: 0,
	badgeDescription: '',
	isActive: true,
};

export default function AdminBadges() {
	const { t } = useTranslation();
	const [badges, setBadges] = useState([]);
	const [areas, setAreas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadData() {
		try {
			setLoading(true);
			const [badgeData, areaData] = await Promise.all([getBadges(), getAreas()]);
			setBadges(badgeData.data || badgeData || []);
			setAreas(areaData.data || areaData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	function getAreaName(areaId) {
		const area = areas.find((a) => a.area_id === areaId || a.areaId === areaId);
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
			areaId: item.area_id || item.areaId || '',
			progressionStageId: item.progression_stage_id || item.progressionStageId || '',
			badgeType: item.badge_type || item.badgeType || 'Standard',
			badgePoints: item.badge_points || item.badgePoints || 0,
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
		setSaving(true);
		try {
			const payload = {
				...form,
				areaId: Number(form.areaId) || form.areaId,
				progressionStageId: Number(form.progressionStageId) || form.progressionStageId,
				badgePoints: Number(form.badgePoints),
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

	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="h3 mb-0">{t('adminBadges.title')}</h1>
				<Button onClick={openCreate}>
					{t('adminBadges.newBadge')}
				</Button>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={5} columns={6} />
					) : badges.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminBadges.noBadges')}</h5>
							<p className="text-muted small">{t('adminBadges.noBadgesDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.title')}</th>
										<th>{t('shared.area')}</th>
										<th>{t('shared.type')}</th>
										<th>{t('shared.points')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{badges.map((b) => (
										<tr key={b.badge_slug || b.badgeSlug}>
											<td>{b.badge_title || b.badgeTitle}</td>
											<td>{getAreaName(b.area_id || b.areaId)}</td>
											<td>
												<span className="badge bg-info">{b.badge_type || b.badgeType}</span>
											</td>
											<td>
												<span className="badge bg-warning text-dark">{b.badge_points || b.badgePoints} pts</span>
											</td>
											<td>
												<span className={`badge ${b.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{b.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<Button size="sm" variant="outlined" className="me-2" title={t('shared.edit')} aria-label={t('shared.edit')} onClick={() => openEdit(b)}>
													<Icon name="pencil" size={14} aria-hidden="true" />
												</Button>
												<Button size="sm" variant="outlined" color="danger" title={t('shared.delete')} aria-label={t('shared.delete')} onClick={() => handleDelete(b)}>
													<Icon name="trash" size={14} aria-hidden="true" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{showModal && (
				<Modal
					title={editItem ? t('adminBadges.editBadge') : t('adminBadges.newBadge')}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setShowModal(false)}>
								{t('shared.cancel')}
							</Button>
							<Button loading={saving} onClick={handleSubmit}>
								{editItem ? t('shared.save') : t('shared.create')}
							</Button>
						</>
					}
				>
					<form id="badge-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('shared.title')}
							name="badgeTitle"
							value={form.badgeTitle}
							onChange={handleChange}
							required
						/>
						<div>
							<label htmlFor="badge_area" className="form-label">{t('shared.area')}</label>
							<select
								id="badge_area"
								className="form-select"
								name="areaId"
								value={form.areaId}
								onChange={handleChange}
								required
							>
								<option value="">{t('shared.select')}</option>
								{areas.map((a) => (
									<option key={a.area_slug || a.areaSlug} value={a.area_id || a.areaId}>
										{a.area_name || a.areaName}
									</option>
								))}
							</select>
						</div>
						<FormInput
							label={t('adminBadges.progressionStageId')}
							name="progressionStageId"
							value={form.progressionStageId}
							onChange={handleChange}
						/>
						<div>
							<label htmlFor="badge_type" className="form-label">{t('shared.type')}</label>
							<select
								id="badge_type"
								className="form-select"
								name="badgeType"
								value={form.badgeType}
								onChange={handleChange}
							>
								{BADGE_TYPES.map((tp) => (
									<option key={tp} value={tp}>{tp}</option>
								))}
							</select>
						</div>
						<FormInput
							label={t('shared.points')}
							name="badgePoints"
							type="number"
							value={form.badgePoints}
							onChange={handleChange}
							min={0}
						/>
						<div>
							<label htmlFor="badge_desc" className="form-label">{t('shared.description')}</label>
							<textarea
								id="badge_desc"
								className="form-control"
								name="badgeDescription"
								rows={3}
								value={form.badgeDescription}
								onChange={handleChange}
							/>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="badge_active"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="badge_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
