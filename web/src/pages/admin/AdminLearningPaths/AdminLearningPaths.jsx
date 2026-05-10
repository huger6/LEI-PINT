import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath } from '../../../services/hierarchyService';
import Modal from '../../../components/Modal/Modal';
import FormButton from '../../../components/FormButton/FormButton';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';

const emptyForm = {
	pathTitle: '',
	pathDescription: '',
	isActive: true,
};

export default function AdminLearningPaths() {
	const { t } = useTranslation();
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
			console.error(err);
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
		if (!window.confirm(t('shared.confirmDelete', { name: item.path_title }))) return;
		try {
			await deleteLearningPath(item.path_slug || item.pathSlug);
			setPaths((prev) => prev.filter((p) => p.path_slug !== item.path_slug));
		} catch (err) {
			console.error(err);
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
				<h1 className="h3 mb-0">{t('adminLearningPaths.title')}</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					{t('adminLearningPaths.newLearningPath')}
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
							<h5 className="text-muted">{t('adminLearningPaths.noLearningPaths')}</h5>
							<p className="text-muted small">{t('adminLearningPaths.noLearningPathsDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.title')}</th>
										<th>{t('shared.slug')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{paths.map((p) => (
										<tr key={p.path_slug || p.pathSlug}>
											<td>{p.path_title}</td>
											<td className="text-muted">{p.path_slug || p.pathSlug || '—'}</td>
											<td>
												<span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{p.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(p)}>
													<Icon name="pencil" size={14} aria-hidden="true" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p)}>
													<Icon name="trash" size={14} aria-hidden="true" />
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
					title={editItem ? t('adminLearningPaths.editLearningPath') : t('adminLearningPaths.newLearningPath')}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<FormButton variant="ghost" onClick={() => setShowModal(false)} className="w-auto">
								{t('shared.cancel')}
							</FormButton>
							<FormButton variant="primary" loading={saving} onClick={handleSubmit} className="w-auto">
								{editItem ? t('shared.save') : t('shared.create')}
							</FormButton>
						</>
					}
				>
					<form id="lp-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('shared.title')}
							name="pathTitle"
							value={form.pathTitle}
							onChange={handleChange}
							required
						/>
						<div>
							<label className="form-label">{t('shared.description')}</label>
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
							<label className="form-check-label" htmlFor="lp_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
