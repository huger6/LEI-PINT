import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAreas, createArea, updateArea, deleteArea, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';

const emptyForm = {
	areaName: '',
	serviceLineId: '',
	areaDescription: '',
	isActive: true,
};

export default function AdminAreas() {
	const { t } = useTranslation();
	const [areas, setAreas] = useState([]);
	const [serviceLines, setServiceLines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadData() {
		try {
			setLoading(true);
			const [areaData, slData] = await Promise.all([getAreas(), getServiceLines()]);
			setAreas(areaData.data || areaData || []);
			setServiceLines(slData.data || slData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	function getSlName(slId) {
		const sl = serviceLines.find((s) => s.service_line_id === slId || s.serviceLineId === slId);
		return sl ? (sl.service_line_name || sl.serviceLineName) : '—';
	}

	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(item) {
		setEditItem(item);
		setForm({
			areaName: item.area_name || item.areaName || '',
			serviceLineId: item.service_line_id || item.serviceLineId || '',
			areaDescription: item.area_description || item.areaDescription || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(item) {
		if (!window.confirm(t('shared.confirmDelete', { name: item.area_name || item.areaName }))) return;
		try {
			await deleteArea(item.area_slug || item.areaSlug);
			setAreas((prev) => prev.filter((a) => a.area_slug !== item.area_slug));
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setSaving(true);
		try {
			if (editItem) {
				const updated = await updateArea(editItem.area_slug || editItem.areaSlug, form);
				setAreas((prev) => prev.map((a) => (a.area_slug === editItem.area_slug ? updated : a)));
			} else {
				const created = await createArea(form);
				setAreas((prev) => [...prev, created]);
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
				<h1 className="h3 mb-0">{t('adminAreas.title')}</h1>
				<Button onClick={openCreate}>
					{t('adminAreas.newArea')}
				</Button>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : areas.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminAreas.noAreas')}</h5>
							<p className="text-muted small">{t('adminAreas.noAreasDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.name')}</th>
										<th>{t('adminAreas.serviceLine')}</th>
										<th>{t('shared.slug')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{areas.map((a) => (
										<tr key={a.area_slug || a.areaSlug}>
											<td>{a.area_name || a.areaName}</td>
											<td>{getSlName(a.service_line_id || a.serviceLineId)}</td>
											<td className="text-muted">{a.area_slug || a.areaSlug || '—'}</td>
											<td>
												<span className={`badge ${a.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{a.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<Button size="sm" variant="outlined" className="me-2" onClick={() => openEdit(a)}>
													<Icon name="pencil" size={14} aria-hidden="true" />
												</Button>
												<Button size="sm" variant="outlined" color="danger" onClick={() => handleDelete(a)}>
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
					title={editItem ? t('adminAreas.editArea') : t('adminAreas.newArea')}
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
					<form id="area-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('shared.name')}
							name="areaName"
							value={form.areaName}
							onChange={handleChange}
							required
						/>
						<div>
							<label htmlFor="area_sl" className="form-label">{t('adminAreas.serviceLine')}</label>
							<select
								id="area_sl"
								className="form-select"
								name="serviceLineId"
								value={form.serviceLineId}
								onChange={handleChange}
								required
							>
								<option value="">{t('shared.select')}</option>
								{serviceLines.map((sl) => (
									<option key={sl.sl_slug || sl.slSlug} value={sl.service_line_id || sl.serviceLineId}>
										{sl.service_line_name || sl.serviceLineName}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="area_desc" className="form-label">{t('shared.description')}</label>
							<textarea
								id="area_desc"
								className="form-control"
								name="areaDescription"
								rows={3}
								value={form.areaDescription}
								onChange={handleChange}
							/>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="area_active"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="area_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
