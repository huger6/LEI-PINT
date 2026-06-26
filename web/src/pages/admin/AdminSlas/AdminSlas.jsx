import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSLAs, createSLA, updateSLA, deleteSLA } from '../../../features/slas/api/slasApi';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import styles from './AdminSlas.module.css';

const TARGET_PROFILES = ['Consultant', 'Talent Manager', 'Service Line Leader', 'Administrator'];

const emptyForm = {
	slaName: '',
	responseTimeHours: 24,
	startDate: '',
	endDate: '',
	targetProfile: '',
	isGlobal: false,
	slaDescription: '',
	serviceLineIds: [],
};

// ISO timestamp -> value for <input type="datetime-local"> (local time, no seconds).
function toLocalInput(iso) {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSlas() {
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Store the list of SLAs fetched from the API.
	const [slas, setSlas] = useState([]);
	// Store available service lines for the SLA scope selector.
	const [serviceLines, setServiceLines] = useState([]);
	// Track whether data is still loading.
	const [loading, setLoading] = useState(true);
	// Hold any page-level error message.
	const [error, setError] = useState('');

	// Control the create/edit modal visibility.
	const [modalOpen, setModalOpen] = useState(false);
	// Track the SLA being edited, or null for create mode.
	const [editItem, setEditItem] = useState(null);
	// Hold the current modal form values.
	const [form, setForm] = useState(emptyForm);
	// Hold field-level validation errors for the form.
	const [errors, setErrors] = useState({});
	// Track whether the form submission is in progress.
	const [saving, setSaving] = useState(false);

	// Fetch all SLAs and service lines in parallel.
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [{ data }, slData] = await Promise.all([getSLAs({ limit: 100 }), getServiceLines()]);
			setSlas(data || []);
			setServiceLines(slData?.data || slData || []);
		} catch (err) {
			console.error(err);
			setError(t('adminSlas.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	// Load data on mount and whenever load changes.
	useEffect(() => { load(); }, [load]);

	// Return the display name of a service line object.
	function slName(sl) {
		return sl.service_line_name || sl.serviceLineName;
	}
	// Return the ID of a service line object.
	function slId(sl) {
		return sl.service_line_id || sl.serviceLineId;
	}

	// Open the modal in create mode with a blank form.
	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setErrors({});
		setModalOpen(true);
	}

	// Open the modal in edit mode pre-populated with the selected SLA's data.
	function openEdit(sla) {
		setEditItem(sla);
		setForm({
			slaName: sla.sla_name || '',
			responseTimeHours: sla.response_time_hours || 24,
			startDate: toLocalInput(sla.start_date),
			endDate: toLocalInput(sla.end_date),
			targetProfile: sla.target_profile || '',
			isGlobal: Boolean(sla.is_global),
			slaDescription: sla.sla_description || '',
			serviceLineIds: (sla.service_line_id_service_lines_sl_slas || []).map((sl) => sl.service_line_id),
		});
		setErrors({});
		setModalOpen(true);
	}

	// Update form state and clear the corresponding field error on change.
	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
		setErrors((prev) => ({ ...prev, [name]: '' }));
	}

	// Toggle a service line's inclusion in the SLA scope list.
	function toggleServiceLine(id) {
		setForm((prev) => ({
			...prev,
			serviceLineIds: prev.serviceLineIds.includes(id)
				? prev.serviceLineIds.filter((x) => x !== id)
				: [...prev.serviceLineIds, id],
		}));
	}

	// Validate the SLA form fields and set inline errors.
	function validate() {
		const next = {};
		if (form.slaName.trim().length < 2) next.slaName = t('adminSlas.errName');
		if (!(Number(form.responseTimeHours) > 0)) next.responseTimeHours = t('adminSlas.errResponseTime');
		if (!form.startDate) next.startDate = t('adminSlas.errStart');
		if (!form.endDate) next.endDate = t('adminSlas.errEnd');
		if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
			next.endDate = t('adminSlas.errEndAfterStart');
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	// Submit the form to create or update an SLA.
	async function handleSubmit(e) {
		e.preventDefault();
		if (!validate()) return;
		setSaving(true);
		try {
			const payload = {
				slaName: form.slaName.trim(),
				responseTimeHours: Number(form.responseTimeHours),
				startDate: new Date(form.startDate).toISOString(),
				endDate: new Date(form.endDate).toISOString(),
				targetProfile: form.targetProfile || null,
				isGlobal: form.isGlobal,
				slaDescription: form.slaDescription.trim() || null,
				serviceLineIds: form.serviceLineIds,
			};
			if (editItem) {
				await updateSLA(editItem.sla_id, payload);
			} else {
				await createSLA(payload);
			}
			setModalOpen(false);
			load();
		} catch (err) {
			console.error(err);
			setErrors({ form: t('adminSlas.saveFailed') });
		} finally {
			setSaving(false);
		}
	}

	// Confirm and deactivate the specified SLA, then reload.
	async function handleDeactivate(sla) {
		if (!window.confirm(t('adminSlas.confirmDeactivate', { name: sla.sla_name }))) return;
		try {
			await deleteSLA(sla.sla_id);
			load();
		} catch (err) {
			console.error(err);
		}
	}

	// Reactivate an inactive SLA and reload the list.
	async function handleReactivate(sla) {
		try {
			await updateSLA(sla.sla_id, { isActive: true });
			load();
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
				<h1 className="h3 mb-0">{t('adminSlas.title')}</h1>
				<Button onClick={openCreate}>
					<Icon name="add" size={14} aria-hidden="true" className="me-1" />
					{t('adminSlas.newSla')}
				</Button>
			</div>
			<p className="text-muted mb-4">{t('adminSlas.subtitle')}</p>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={4} columns={6} />
					) : slas.length === 0 ? (
						<p className="text-muted small mb-0">{t('adminSlas.empty')}</p>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('adminSlas.name')}</th>
										<th>{t('adminSlas.responseTime')}</th>
										<th>{t('adminSlas.scope')}</th>
										<th>{t('adminSlas.period')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{slas.map((sla) => (
										<tr key={sla.sla_id}>
											<td>
												<div className="fw-semibold">{sla.sla_name}</div>
												{sla.target_profile && <div className="small text-muted">{sla.target_profile}</div>}
											</td>
											<td>{t('adminSlas.hours', { count: sla.response_time_hours })}</td>
											<td>
												{sla.is_global ? (
													<span className="badge bg-secondary">{t('adminSlas.global')}</span>
												) : (
													<span className="small">
														{(sla.service_line_id_service_lines_sl_slas || []).length
															? t('adminSlas.slCount', { count: sla.service_line_id_service_lines_sl_slas.length })
															: '—'}
													</span>
												)}
											</td>
											<td className="small text-muted">
												{new Date(sla.start_date).toLocaleDateString('pt-PT')} – {new Date(sla.end_date).toLocaleDateString('pt-PT')}
											</td>
											<td>
												<span className={`badge ${sla.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{sla.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<Tooltip text={t('shared.edit')}>
													<Button size="sm" variant="outlined" className="me-2" aria-label={t('shared.edit')} onClick={() => openEdit(sla)}>
														<Icon name="pencil" size={14} aria-hidden="true" />
													</Button>
												</Tooltip>
												{sla.is_active ? (
													<Tooltip text={t('shared.deactivate')}>
														<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.deactivate')} onClick={() => handleDeactivate(sla)}>
															<Icon name="trash" size={14} aria-hidden="true" />
														</Button>
													</Tooltip>
												) : (
													<Button size="sm" variant="outlined" onClick={() => handleReactivate(sla)}>
														{t('adminSlas.reactivate')}
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{modalOpen && (
				<Modal
					title={editItem ? t('adminSlas.editSla') : t('adminSlas.newSla')}
					size="lg"
					onClose={() => setModalOpen(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setModalOpen(false)}>{t('shared.cancel')}</Button>
							<Button loading={saving} onClick={handleSubmit}>{editItem ? t('shared.save') : t('shared.create')}</Button>
						</>
					}
				>
					<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('adminSlas.name')}
							name="slaName"
							value={form.slaName}
							onChange={handleChange}
							error={errors.slaName}
							required
						/>
						<div className="row g-3">
							<div className="col-12 col-sm-6">
								<FormInput
									label={t('adminSlas.responseTimeHours')}
									name="responseTimeHours"
									type="number"
									min={1}
									value={form.responseTimeHours}
									onChange={handleChange}
									error={errors.responseTimeHours}
								/>
							</div>
							<div className="col-12 col-sm-6">
								<label className="form-label">{t('adminSlas.targetProfile')}</label>
								<CustomSelect
									name="targetProfile"
									value={form.targetProfile}
									onChange={handleChange}
									ariaLabel={t('adminSlas.targetProfile')}
									options={[{ value: '', label: t('adminSlas.anyProfile') }, ...TARGET_PROFILES.map((p) => ({ value: p, label: p }))]}
								/>
							</div>
						</div>
						<div className="row g-3">
							<div className="col-12 col-sm-6">
								<FormInput
									label={t('adminSlas.startDate')}
									name="startDate"
									type="datetime-local"
									value={form.startDate}
									onChange={handleChange}
									error={errors.startDate}
								/>
							</div>
							<div className="col-12 col-sm-6">
								<FormInput
									label={t('adminSlas.endDate')}
									name="endDate"
									type="datetime-local"
									value={form.endDate}
									onChange={handleChange}
									error={errors.endDate}
								/>
							</div>
						</div>
						<div className="form-check">
							<input className="form-check-input" type="checkbox" name="isGlobal" id="sla_global" checked={form.isGlobal} onChange={handleChange} />
							<label className="form-check-label" htmlFor="sla_global">{t('adminSlas.isGlobal')}</label>
						</div>
						{!form.isGlobal && (
							<div>
								<label className="form-label">{t('adminSlas.serviceLines')}</label>
								<div className={styles.slGrid}>
									{serviceLines.map((sl) => (
										<div className="form-check" key={slId(sl)}>
											<input
												className="form-check-input"
												type="checkbox"
												id={`sl_${slId(sl)}`}
												checked={form.serviceLineIds.includes(slId(sl))}
												onChange={() => toggleServiceLine(slId(sl))}
											/>
											<label className="form-check-label" htmlFor={`sl_${slId(sl)}`}>{slName(sl)}</label>
										</div>
									))}
								</div>
							</div>
						)}
						<div>
							<label htmlFor="sla_desc" className="form-label">{t('shared.description')}</label>
							<textarea id="sla_desc" className="form-control" name="slaDescription" rows={3} value={form.slaDescription} onChange={handleChange} />
						</div>
						{errors.form && <p className="small text-danger mb-0">{errors.form}</p>}
					</form>
				</Modal>
			)}
		</div>
	);
}
