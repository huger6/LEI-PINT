import { useState, useEffect } from 'react';
import { getLevels, createLevel, updateLevel, deleteLevel, getAreas } from '../../services/hierarchyService';
import Modal from '../../components/Modal/Modal';
import FormButton from '../../components/FormButton/FormButton';
import FormInput from '../../components/FormInput/FormInput';

const emptyForm = {
	stageCode: '',
	stageTitle: '',
	stageSequence: '',
	stageDescription: '',
	areaId: '',
	isActive: true,
};

export default function AdminLevels() {
	const [levels, setLevels] = useState([]);
	const [areas, setAreas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadData() {
		try {
			setLoading(true);
			const [levelData, areaData] = await Promise.all([getLevels(), getAreas()]);
			setLevels(levelData.data || levelData || []);
			setAreas(areaData.data || areaData || []);
		} catch (err) {
			console.error('Erro ao carregar níveis:', err);
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
			stageCode: item.stage_code?.stage_code || item.stageCode || '',
			stageTitle: item.stage_title || item.stageTitle || '',
			stageSequence: item.stage_sequence ?? item.stageSequence ?? '',
			stageDescription: item.stage_description || item.stageDescription || '',
			areaId: item.area_id || item.areaId || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(item) {
		const code = item.stage_code?.stage_code || item.stageCode;
		if (!window.confirm(`Tem certeza que deseja eliminar o nível "${code}"?`)) return;
		try {
			await deleteLevel(code);
			setLevels((prev) => prev.filter((l) => (l.stage_code?.stage_code || l.stageCode) !== code));
		} catch (err) {
			console.error('Erro ao eliminar nível:', err);
		}
	}

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
			console.error('Erro ao guardar nível:', err);
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
				<h1 className="h3 mb-0">Níveis de Progressão</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					Novo Nível
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : levels.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">Sem níveis</h5>
							<p className="text-muted small">Nenhum nível de progressão encontrado.</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>Código</th>
										<th>Título</th>
										<th>Área</th>
										<th>Sequência</th>
										<th>Ativo</th>
										<th className="text-end">Ações</th>
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
													{l.is_active ? 'Sim' : 'Não'}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(l)}>
													<i className="bi bi-pencil" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(l)}>
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
					title={editItem ? 'Editar Nível' : 'Novo Nível'}
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
					<form id="level-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label="Código do Nível"
							name="stageCode"
							value={form.stageCode}
							onChange={handleChange}
							required
							disabled={!!editItem}
						/>
						<FormInput
							label="Título"
							name="stageTitle"
							value={form.stageTitle}
							onChange={handleChange}
							required
						/>
						<div>
							<label htmlFor="level_area" className="form-label">Área</label>
							<select
								id="level_area"
								className="form-select"
								name="areaId"
								value={form.areaId}
								onChange={handleChange}
								required
							>
								<option value="">Selecionar...</option>
								{areas.map((a) => (
									<option key={a.area_slug || a.areaSlug} value={a.area_id || a.areaId}>
										{a.area_name || a.areaName}
									</option>
								))}
							</select>
						</div>
						<FormInput
							label="Sequência"
							name="stageSequence"
							type="number"
							value={form.stageSequence}
							onChange={handleChange}
							min={0}
						/>
						<div>
							<label htmlFor="level_desc" className="form-label">Descrição</label>
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
							<label className="form-check-label" htmlFor="level_active">Ativo</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
