import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceLines, createServiceLine, updateServiceLine, deleteServiceLine, getLearningPaths } from '../../../services/hierarchyService';
import Modal from '../../../components/Modal/Modal';
import FormButton from '../../../components/FormButton/FormButton';
import FormInput from '../../../components/FormInput/FormInput';

const emptyForm = {
	serviceLineName: '',
	learningPathId: '',
	serviceLineDescription: '',
	isActive: true,
};

export default function AdminServiceLines() {
	const { t } = useTranslation();
	const [serviceLines, setServiceLines] = useState([]);
	const [learningPaths, setLearningPaths] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadData() {
		try {
			setLoading(true);
			const [slData, lpData] = await Promise.all([getServiceLines(), getLearningPaths()]);
			setServiceLines(slData.data || slData || []);
			setLearningPaths(lpData.data || lpData || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	function getLpName(lpId) {
		const lp = learningPaths.find((p) => p.learning_path_id === lpId || p.learningPathId === lpId);
		return lp ? (lp.path_title || lp.pathTitle) : '—';
	}

	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(item) {
		setEditItem(item);
		setForm({
			serviceLineName: item.service_line_name || item.serviceLineName || '',
			learningPathId: item.learning_path_id || item.learningPathId || '',
			serviceLineDescription: item.service_line_description || item.serviceLineDescription || '',
			isActive: item.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(item) {
		if (!window.confirm(t('shared.confirmDelete', { name: item.service_line_name || item.serviceLineName }))) return;
		try {
			await deleteServiceLine(item.sl_slug || item.slSlug);
			setServiceLines((prev) => prev.filter((s) => s.sl_slug !== item.sl_slug));
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setSaving(true);
		try {
			if (editItem) {
				const updated = await updateServiceLine(editItem.sl_slug || editItem.slSlug, form);
				setServiceLines((prev) => prev.map((s) => (s.sl_slug === editItem.sl_slug ? updated : s)));
			} else {
				const created = await createServiceLine(form);
				setServiceLines((prev) => [...prev, created]);
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
				<h1 className="h3 mb-0">{t('adminServiceLines.title')}</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					{t('adminServiceLines.newServiceLine')}
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : serviceLines.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminServiceLines.noServiceLines')}</h5>
							<p className="text-muted small">{t('adminServiceLines.noServiceLinesDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.name')}</th>
										<th>{t('adminServiceLines.learningPath')}</th>
										<th>{t('shared.slug')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{serviceLines.map((s) => (
										<tr key={s.sl_slug || s.slSlug}>
											<td>{s.service_line_name || s.serviceLineName}</td>
											<td>{getLpName(s.learning_path_id || s.learningPathId)}</td>
											<td className="text-muted">{s.sl_slug || s.slSlug || '—'}</td>
											<td>
												<span className={`badge ${s.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{s.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(s)}>
													<i className="bi bi-pencil" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s)}>
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
					title={editItem ? t('adminServiceLines.editServiceLine') : t('adminServiceLines.newServiceLine')}
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
					<form id="sl-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('shared.name')}
							name="serviceLineName"
							value={form.serviceLineName}
							onChange={handleChange}
							required
						/>
						<div>
							<label className="form-label">{t('adminServiceLines.learningPath')}</label>
							<select
								className="form-select"
								name="learningPathId"
								value={form.learningPathId}
								onChange={handleChange}
								required
							>
								<option value="">{t('shared.select')}</option>
								{learningPaths.map((lp) => (
									<option key={lp.learning_path_id || lp.learningPathId} value={lp.learning_path_id || lp.learningPathId}>
										{lp.path_title || lp.pathTitle}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="form-label">{t('shared.description')}</label>
							<textarea
								className="form-control"
								name="serviceLineDescription"
								rows={3}
								value={form.serviceLineDescription}
								onChange={handleChange}
							/>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="sl_active"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="sl_active">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
