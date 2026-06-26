import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceLines, createServiceLine, updateServiceLine, deleteServiceLine, getLearningPaths } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';

const emptyForm = {
	serviceLineName: '',
	learningPathId: '',
	serviceLineDescription: '',
	isActive: true,
};

export default function AdminServiceLines() {
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Store the list of service lines fetched from the API.
	const [serviceLines, setServiceLines] = useState([]);
	// Store available learning paths for the dropdown.
	const [learningPaths, setLearningPaths] = useState([]);
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

	// Fetch both service lines and learning paths in parallel.
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

	// Load data on initial mount.
	useEffect(() => {
		loadData();
	}, []);

	// Resolve a learning path's display name by its ID.
	function getLpName(lpId) {
		const lp = learningPaths.find((p) => p.learning_path_id === lpId || p.learningPathId === lpId);
		return lp ? (lp.path_title || lp.pathTitle) : '—';
	}

	// Open the modal in create mode with a blank form.
	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	// Open the modal in edit mode pre-populated with the selected service line's data.
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

	// Confirm and delete the specified service line.
	async function handleDelete(item) {
		if (!window.confirm(t('shared.confirmDelete', { name: item.service_line_name || item.serviceLineName }))) return;
		try {
			await deleteServiceLine(item.sl_slug || item.slSlug);
			setServiceLines((prev) => prev.filter((s) => s.sl_slug !== item.sl_slug));
		} catch (err) {
			console.error(err);
		}
	}

	// Submit the form to create or update a service line.
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

	// Update the form state when any input changes.
	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="h3 mb-0">{t('adminServiceLines.title')}</h1>
				<Button onClick={openCreate}>
					{t('adminServiceLines.newServiceLine')}
				</Button>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={5} columns={5} />
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
												<Tooltip text={t('shared.edit')}>
													<Button size="sm" variant="outlined" className="me-2" aria-label={t('shared.edit')} onClick={() => openEdit(s)}>
														<Icon name="pencil" size={14} aria-hidden="true" />
													</Button>
												</Tooltip>
												<Tooltip text={t('shared.delete')}>
													<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.delete')} onClick={() => handleDelete(s)}>
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
					title={editItem ? t('adminServiceLines.editServiceLine') : t('adminServiceLines.newServiceLine')}
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
