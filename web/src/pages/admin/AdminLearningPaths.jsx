import { useState, useEffect } from 'react';
import { getLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath } from '../../services/hierarchyService';
import Modal from '../../components/Modal/Modal';
import FormButton from '../../components/FormButton/FormButton';
import FormInput from '../../components/FormInput/FormInput';

const emptyForm = {
	pathTitle: '',
	pathDescription: '',
	isActive: true,
};

export default function AdminLearningPaths() {
	const [paths, setPaths] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadPaths() {
		try {
			setLoading(true);
			const data = await getLearningPaths();
			setPaths(data.data || data || []);
		} catch (err) {
			console.error('Erro ao carregar learning paths:', err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadPaths();
	}, []);

	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(item) {
		setEditItem(item);
		setForm({
			pathTitle: item.path_title || '',
			pathDescription: item.path_description || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(item) {
		if (!window.confirm(`Tem certeza que deseja eliminar "${item.path_title}"?`)) return;
		try {
			await deleteLearningPath(item.path_slug || item.pathSlug);
			setPaths((prev) => prev.filter((p) => p.path_slug !== item.path_slug));
		} catch (err) {
			console.error('Erro ao eliminar learning path:', err);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setSaving(true);
		try {
			if (editItem) {
				const updated = await updateLearningPath(editItem.path_slug || editItem.pathSlug, form);
				setPaths((prev) => prev.map((p) => (p.path_slug === editItem.path_slug ? updated : p)));
			} else {
				const created = await createLearningPath(form);
				setPaths((prev) => [...prev, created]);
			}
			setShowModal(false);
		} catch (err) {
			console.error('Erro ao guardar learning path:', err);
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
				<h1 className="h3 mb-0">Learning Paths</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					Novo Learning Path
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : paths.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">Sem learning paths</h5>
							<p className="text-muted small">Nenhum learning path encontrado.</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>Título</th>
										<th>Slug</th>
										<th>Ativo</th>
										<th className="text-end">Ações</th>
									</tr>
								</thead>
								<tbody>
									{paths.map((p) => (
										<tr key={p.path_slug || p.pathSlug}>
											<td>{p.path_title}</td>
											<td className="text-muted">{p.path_slug || p.pathSlug || '—'}</td>
											<td>
												<span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{p.is_active ? 'Sim' : 'Não'}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(p)}>
													<i className="bi bi-pencil" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)}>
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
					title={editItem ? 'Editar Learning Path' : 'Novo Learning Path'}
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
					<form id="lp-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label="Título"
							name="pathTitle"
							value={form.pathTitle}
							onChange={handleChange}
							required
						/>
						<div>
							<label className="form-label">Descrição</label>
							<textarea
								className="form-control"
								name="pathDescription"
								rows={3}
								value={form.pathDescription}
								onChange={handleChange}
							/>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="lp_active"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="lp_active">Ativo</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
