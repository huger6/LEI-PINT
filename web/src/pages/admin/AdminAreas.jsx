import { useState, useEffect } from 'react';
import { getAreas, createArea, updateArea, deleteArea, getServiceLines } from '../../services/hierarchyService';
import Modal from '../../components/Modal/Modal';
import FormButton from '../../components/FormButton/FormButton';
import FormInput from '../../components/FormInput/FormInput';

const emptyForm = {
	areaName: '',
	serviceLineId: '',
	areaDescription: '',
	isActive: true,
};

export default function AdminAreas() {
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
			console.error('Erro ao carregar áreas:', err);
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
		if (!window.confirm(`Tem certeza que deseja eliminar "${item.area_name || item.areaName}"?`)) return;
		try {
			await deleteArea(item.area_slug || item.areaSlug);
			setAreas((prev) => prev.filter((a) => a.area_slug !== item.area_slug));
		} catch (err) {
			console.error('Erro ao eliminar área:', err);
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
			console.error('Erro ao guardar área:', err);
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
				<h1 className="h3 mb-0">Áreas</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					Nova Área
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : areas.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">Sem áreas</h5>
							<p className="text-muted small">Nenhuma área encontrada.</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>Nome</th>
										<th>Service Line</th>
										<th>Slug</th>
										<th>Ativo</th>
										<th className="text-end">Ações</th>
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
													{a.is_active ? 'Sim' : 'Não'}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(a)}>
													<i className="bi bi-pencil" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a)}>
													<i className="bi bi-trash" />
												</button>
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
					title={editItem ? 'Editar Área' : 'Nova Área'}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<FormButton variant="ghost" onClick={() => setShowModal(false)} className="w-auto">
								Cancelar
							</FormButton>
							<FormButton variant="primary" loading={saving} onClick={handleSubmit} className="w-auto">
								{editItem ? 'Guardar' : 'Criar'}
							</FormButton>
						</>
					}
				>
					<form id="area-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label="Nome"
							name="areaName"
							value={form.areaName}
							onChange={handleChange}
							required
						/>
						<div>
							<label htmlFor="area_sl" className="form-label">Service Line</label>
							<select
								id="area_sl"
								className="form-select"
								name="serviceLineId"
								value={form.serviceLineId}
								onChange={handleChange}
								required
							>
								<option value="">Selecionar...</option>
								{serviceLines.map((sl) => (
									<option key={sl.sl_slug || sl.slSlug} value={sl.service_line_id || sl.serviceLineId}>
										{sl.service_line_name || sl.serviceLineName}
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="area_desc" className="form-label">Descrição</label>
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
							<label className="form-check-label" htmlFor="area_active">Ativo</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
