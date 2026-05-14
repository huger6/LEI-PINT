import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLearningPaths, createLearningPath, updateLearningPath, deleteLearningPath } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
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
				<Button onClick={openCreate}>
					{t('adminLearningPaths.newLearningPath')}
				</Button>
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
												<Button size="sm" variant="outlined" className="me-2" title={t('shared.edit')} onClick={() => openEdit(p)}>
													<Icon name="pencil" size={14} aria-hidden="true" />
												</Button>
												<Button size="sm" variant="outlined" color="danger" title={t('shared.delete')} onClick={() => handleDelete(p)}>
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
					title={editItem ? t('adminLearningPaths.editLearningPath') : t('adminLearningPaths.newLearningPath')}
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
