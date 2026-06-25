import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLevels, createLevel, updateLevel, deleteLevel, getAreas } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';

const emptyForm = {
	stageCode: '',
	stageTitle: '',
	stageSequence: '',
	stageDescription: '',
	areaId: '',
	isActive: true,
};

export default function AdminLevels() {
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Store the list of progression levels fetched from the API.
	const [levels, setLevels] = useState([]);
	// Store available areas for the dropdown selector.
	const [areas, setAreas] = useState([]);
	// Track whether data is still loading.
	const [loading, setLoading] = useState(true);
	// Control modal visibility.
	const [showModal, setShowModal] = useState(false);
	// Track the item being edited, or null for create mode.
	const [editItem, setEditItem] = useState(null);
	// Hold the current modal form values.
	const [form, setForm] = useState(emptyForm);
	// Track whether the form submission is in progress.
	const [saving, setSaving] = useState(false);

	// Fetch both levels and areas in parallel.
	async function loadData() {
		try {
			setLoading(true);
			const [levelData, areaData] = await Promise.all([getLevels(), getAreas()]);
			setLevels(levelData.data || levelData || []);
			setAreas(areaData.data || areaData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	// Load data on initial mount.
	useEffect(() => {
		loadData();
	}, []);

	// Resolve an area's display name by its ID.
	function getAreaName(areaId) {
		const area = areas.find((a) => a.area_id === areaId || a.areaId === areaId);
		return area ? (area.area_name || area.areaName) : '—';
	}

	// Open the modal in create mode with a blank form.
	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	// Open the modal in edit mode pre-populated with the selected level's data.
	function openEdit(item) {
		setEditItem(item);
		setForm({
			stageCode: item.stage_code?.stage_code || item.stageCode || '',
			stageTitle: item.stage_title || item.stageTitle || '',
			stageSequence: item.stage_sequence ?? item.stageSequence ?? '',
			stageDescription: item.stage_description || item.stageDescription || '',
			areaId: item.area_id || item.areaId || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	// Confirm and delete the specified progression level.
	async function handleDelete(item) {
		const code = item.stage_code?.stage_code || item.stageCode;
		if (!window.confirm(t('shared.confirmDelete', { name: code }))) return;
		try {
			await deleteLevel(code);
			setLevels((prev) => prev.filter((l) => (l.stage_code?.stage_code || l.stageCode) !== code));
		} catch (err) {
			console.error(err);
		}
	}

	// Submit the form to create or update a progression level.
	async function handleSubmit(e) {
		e.preventDefault();
		setSaving(true);
		try {
			const payload = {
				...form,
				areaId: Number(form.areaId) || form.areaId,
				stageSequence: form.stageSequence ? Number(form.stageSequence) : null,
			};
			if (editItem) {
				const code = editItem.stage_code?.stage_code || editItem.stageCode;
				const updated = await updateLevel(code, payload);
				setLevels((prev) => prev.map((l) => ((l.stage_code?.stage_code || l.stageCode) === code ? updated : l)));
			} else {
				const created = await createLevel(payload);
				setLevels((prev) => [...prev, created]);
			}
			setShowModal(false);
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	}

	// Update the form state when any input changes.
	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="h3 mb-0">{t('adminLevels.title')}</h1>
				<Button onClick={openCreate}>
					{t('adminLevels.newLevel')}
				</Button>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={5} columns={6} />
					) : levels.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminLevels.noLevels')}</h5>
							<p className="text-muted small">{t('adminLevels.noLevelsDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.code')}</th>
										<th>{t('shared.title')}</th>
										<th>{t('shared.area')}</th>
										<th>{t('shared.sequence')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{levels.map((l) => (
										<tr key={l.stage_code?.stage_code || l.stageCode || l.progression_stage_id || l.progressionStageId}>
											<td className="fw-medium">{l.stage_code?.stage_code || l.stageCode || '—'}</td>
											<td>{l.stage_title || l.stageTitle || '—'}</td>
											<td>{getAreaName(l.area_id || l.areaId)}</td>
											<td>{l.stage_sequence ?? l.stageSequence ?? '—'}</td>
											<td>
												<span className={`badge ${l.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{l.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<Tooltip text={t('shared.edit')}>
													<Button size="sm" variant="outlined" className="me-2" aria-label={t('shared.edit')} onClick={() => openEdit(l)}>
														<Icon name="pencil" size={14} aria-hidden="true" />
													</Button>
												</Tooltip>
												<Tooltip text={t('shared.delete')}>
													<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.delete')} onClick={() => handleDelete(l)}>
														<Icon name="trash" size={14} aria-hidden="true" />
													</Button>
												</Tooltip>
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
					title={editItem ? t('adminLevels.editLevel') : t('adminLevels.newLevel')}
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
					<form id="level-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('adminLevels.levelCode')}
							name="stageCode"
							value={form.stageCode}
							onChange={handleChange}
							required
							disabled={!!editItem}
						/>
						<FormInput
							label={t('shared.title')}
							name="stageTitle"
							value={form.stageTitle}
							onChange={handleChange}
							required
						/>
						<div>
							<label htmlFor="level_area" className="form-label">{t('shared.area')}</label>
							<select
								id="level_area"
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
							label={t('shared.sequence')}
							name="stageSequence"
							type="number"
							value={form.stageSequence}
							onChange={handleChange}
							min={0}
						/>
						<div>
							<label htmlFor="level_desc" className="form-label">{t('shared.description')}</label>
							<textarea
								id="level_desc"
								className="form-control"
								name="stageDescription"
								rows={3}
								value={form.stageDescription}
								onChange={handleChange}
							/>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="level_active"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="level_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
