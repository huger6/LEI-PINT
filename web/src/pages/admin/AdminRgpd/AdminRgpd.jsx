import { useState, useEffect, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
	getPolicies,
	createPolicy,
	updatePolicy,
	deactivatePolicy,
	activatePolicy,
	newPolicyVersion,
} from '../../../features/gdpr/api/gdprAdminApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import styles from './AdminRgpd.module.css';

const POLICY_TYPES = ['Privacy', 'Terms', 'Cookies'];

const emptyForm = { policy_type: 'Privacy', version: '', policy_text: '', is_mandatory: true };

export default function AdminRgpd() {
	const { t } = useTranslation();
	const [policies, setPolicies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// modal: { mode: 'create' | 'version', policy? }
	const [modal, setModal] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [expanded, setExpanded] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setPolicies(await getPolicies() || []);
		} catch (err) {
			console.error(err);
			setError(t('adminRgpd.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => { load(); }, [load]);

	function openCreate() {
		setForm(emptyForm);
		setErrors({});
		setModal({ mode: 'create' });
	}

	function openVersion(policy) {
		setForm({ policy_type: policy.policy_type, version: '', policy_text: policy.policy_text || '', is_mandatory: policy.is_mandatory });
		setErrors({});
		setModal({ mode: 'version', policy });
	}

	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
		setErrors((prev) => ({ ...prev, [name]: '' }));
	}

	function validate() {
		const next = {};
		if (!form.version.trim() || form.version.trim().length > 30) next.version = t('adminRgpd.errVersion');
		if (!form.policy_text.trim()) next.policy_text = t('adminRgpd.errText');
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!validate()) return;
		setSaving(true);
		try {
			if (modal.mode === 'create') {
				await createPolicy({
					policy_type: form.policy_type,
					version: form.version.trim(),
					policy_text: form.policy_text.trim(),
					is_mandatory: form.is_mandatory,
				});
			} else {
				await newPolicyVersion(modal.policy.policy_id, {
					version: form.version.trim(),
					policy_text: form.policy_text.trim(),
					is_mandatory: form.is_mandatory,
				});
			}
			setModal(null);
			load();
		} catch (err) {
			console.error(err);
			setErrors({ form: t('adminRgpd.saveFailed') });
		} finally {
			setSaving(false);
		}
	}

	async function toggleMandatory(policy) {
		try {
			await updatePolicy(policy.policy_id, { is_mandatory: !policy.is_mandatory });
			setPolicies((prev) => prev.map((p) => (p.policy_id === policy.policy_id ? { ...p, is_mandatory: !p.is_mandatory } : p)));
		} catch (err) {
			console.error(err);
		}
	}

	async function handleDeactivate(policy) {
		if (!window.confirm(t('adminRgpd.confirmDeactivate', { type: policy.policy_type, version: policy.version }))) return;
		try {
			await deactivatePolicy(policy.policy_id);
			load();
		} catch (err) {
			console.error(err);
		}
	}

	async function handleActivate(policy) {
		try {
			await activatePolicy(policy.policy_id);
			load();
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
				<h1 className="h3 mb-0">{t('adminRgpd.title')}</h1>
				<Button onClick={openCreate}>
					<Icon name="add" size={14} aria-hidden="true" className="me-1" />
					{t('adminRgpd.newPolicy')}
				</Button>
			</div>
			<p className="text-muted mb-4">{t('adminRgpd.subtitle')}</p>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={3} columns={5} />
					) : policies.length === 0 ? (
						<p className="text-muted small mb-0">{t('adminRgpd.empty')}</p>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('adminRgpd.type')}</th>
										<th>{t('adminRgpd.version')}</th>
										<th>{t('shared.status')}</th>
										<th>{t('adminRgpd.mandatory')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{policies.map((p) => (
										<Fragment key={p.policy_id}>
											<tr className={p.is_active ? '' : 'opacity-75'}>
												<td><span className="badge bg-info">{t(`adminRgpd.types.${p.policy_type}`, { defaultValue: p.policy_type })}</span></td>
												<td>{p.version}</td>
												<td>
													<span className={`badge ${p.is_active ? 'bg-success' : 'bg-secondary'}`}>
														{p.is_active ? t('shared.active') : t('shared.inactive')}
													</span>
												</td>
												<td>
													<div className="form-check form-switch m-0">
														<input
															className="form-check-input"
															type="checkbox"
															role="switch"
															aria-label={t('adminRgpd.mandatory')}
															checked={Boolean(p.is_mandatory)}
															onChange={() => toggleMandatory(p)}
														/>
													</div>
												</td>
												<td className="text-end">
													<Tooltip text={t('adminRgpd.viewText')}>
														<Button size="sm" variant="outlined" className="me-2" aria-label={t('adminRgpd.viewText')}
															onClick={() => setExpanded(expanded === p.policy_id ? null : p.policy_id)}>
															<Icon name="eye" size={14} aria-hidden="true" />
														</Button>
													</Tooltip>
													<Tooltip text={t('adminRgpd.newVersion')}>
														<Button size="sm" variant="outlined" className="me-2" aria-label={t('adminRgpd.newVersion')} onClick={() => openVersion(p)}>
															<Icon name="pencil" size={14} aria-hidden="true" />
														</Button>
													</Tooltip>
													{p.is_active ? (
														<Tooltip text={t('shared.deactivate')}>
															<Button size="sm" variant="outlined" color="danger" aria-label={t('shared.deactivate')} onClick={() => handleDeactivate(p)}>
																<Icon name="trash" size={14} aria-hidden="true" />
															</Button>
														</Tooltip>
													) : (
														<Tooltip text={t('shared.reactivate')}>
															<Button size="sm" variant="outlined" color="success" aria-label={t('shared.reactivate')} onClick={() => handleActivate(p)}>
																<Icon name="activate" size={14} aria-hidden="true" />
															</Button>
														</Tooltip>
													)}
												</td>
											</tr>
											{expanded === p.policy_id && (
												<tr>
													<td colSpan={5}>
														<div className={styles.policyText}>{p.policy_text || t('adminRgpd.noText')}</div>
													</td>
												</tr>
											)}
										</Fragment>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{modal && (
				<Modal
					title={modal.mode === 'create' ? t('adminRgpd.newPolicy') : t('adminRgpd.newVersionFor', { type: modal.policy.policy_type })}
					onClose={() => setModal(null)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setModal(null)}>{t('shared.cancel')}</Button>
							<Button loading={saving} onClick={handleSubmit}>{t('shared.save')}</Button>
						</>
					}
				>
					<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						{modal.mode === 'create' && (
							<div>
								<label htmlFor="policy_type" className="form-label">{t('adminRgpd.type')}</label>
								<CustomSelect
									name="policy_type"
									value={form.policy_type}
									onChange={handleChange}
									ariaLabel={t('adminRgpd.type')}
									options={POLICY_TYPES.map((pt) => ({ value: pt, label: t(`adminRgpd.types.${pt}`, { defaultValue: pt }) }))}
								/>
							</div>
						)}
						<FormInput
							label={t('adminRgpd.version')}
							name="version"
							value={form.version}
							onChange={handleChange}
							error={errors.version}
							placeholder="ex: 1.0"
							required
						/>
						<div>
							<label htmlFor="policy_text" className="form-label">{t('adminRgpd.text')}</label>
							<textarea
								id="policy_text"
								className={`form-control ${errors.policy_text ? 'is-invalid' : ''}`}
								name="policy_text"
								rows={8}
								value={form.policy_text}
								onChange={handleChange}
							/>
							{errors.policy_text && <div className="invalid-feedback d-block">{errors.policy_text}</div>}
						</div>
						<div className="form-check">
							<input className="form-check-input" type="checkbox" name="is_mandatory" id="policy_mandatory" checked={form.is_mandatory} onChange={handleChange} />
							<label className="form-check-label" htmlFor="policy_mandatory">{t('adminRgpd.mandatory')}</label>
						</div>
						{errors.form && <p className="small text-danger mb-0">{errors.form}</p>}
					</form>
				</Modal>
			)}
		</div>
	);
}
