import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getWebhooks, createWebhook, deleteWebhook, toggleWebhook, testWebhook } from '../../../features/integrations/api/integrationsApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import SaveToast from '../../../components/SaveToast/SaveToast';
import styles from './AdminIntegrations.module.css';

const emptyForm = { channelName: '', webhookUrl: '' };

export default function AdminIntegrations() {
	const { t } = useTranslation();
	const [webhooks, setWebhooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [toast, setToast] = useState('');

	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [busyId, setBusyId] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setWebhooks(await getWebhooks());
		} catch (err) {
			console.error(err);
			setError(t('adminIntegrations.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => { load(); }, [load]);

	function openCreate() {
		setForm(emptyForm);
		setErrors({});
		setModalOpen(true);
	}

	function handleChange(e) {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: '' }));
	}

	function validate() {
		const next = {};
		const url = form.webhookUrl.trim();
		if (!url) next.webhookUrl = t('adminIntegrations.errUrlRequired');
		else if (!/^https:\/\/.+/i.test(url)) next.webhookUrl = t('adminIntegrations.errUrlHttps');
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!validate()) return;
		setSaving(true);
		try {
			await createWebhook({
				platform: 'teams',
				webhook_url: form.webhookUrl.trim(),
				channel_name: form.channelName.trim() || undefined,
			});
			setModalOpen(false);
			load();
		} catch (err) {
			console.error(err);
			setErrors({ form: t('adminIntegrations.saveFailed') });
		} finally {
			setSaving(false);
		}
	}

	async function handleToggle(wh) {
		setBusyId(wh.webhook_id);
		setWebhooks((prev) => prev.map((w) => (w.webhook_id === wh.webhook_id ? { ...w, is_active: !w.is_active } : w)));
		try {
			await toggleWebhook(wh.webhook_id);
		} catch (err) {
			console.error(err);
			setWebhooks((prev) => prev.map((w) => (w.webhook_id === wh.webhook_id ? { ...w, is_active: wh.is_active } : w)));
		} finally {
			setBusyId(null);
		}
	}

	async function handleTest(wh) {
		setBusyId(wh.webhook_id);
		try {
			await testWebhook(wh.webhook_id);
			setToast(t('adminIntegrations.testSent'));
		} catch (err) {
			console.error(err);
			setToast(t('adminIntegrations.testFailed'));
		} finally {
			setBusyId(null);
		}
	}

	async function handleDelete(wh) {
		if (!window.confirm(t('adminIntegrations.confirmDelete', { name: wh.channel_name || 'Microsoft Teams' }))) return;
		setBusyId(wh.webhook_id);
		try {
			await deleteWebhook(wh.webhook_id);
			load();
		} catch (err) {
			console.error(err);
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
				<h1 className="h3 mb-0">{t('adminIntegrations.title')}</h1>
				<Button onClick={openCreate}>
					<Icon name="add" size={14} aria-hidden="true" className="me-1" />
					{t('adminIntegrations.newWebhook')}
				</Button>
			</div>
			<p className="text-muted mb-4">{t('adminIntegrations.subtitle')}</p>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={3} columns={4} />
					) : webhooks.length === 0 ? (
						<div className={styles.empty}>
							<Icon name="link" size={28} aria-hidden="true" />
							<p className="mb-0">{t('adminIntegrations.empty')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('adminIntegrations.platform')}</th>
										<th>{t('adminIntegrations.channel')}</th>
										<th className="text-center">{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{webhooks.map((wh) => (
										<tr key={wh.webhook_id}>
											<td>
												<span className={styles.platform}>
													<Icon name="link" size={16} aria-hidden="true" />
													{wh.platform === 'teams' ? 'Microsoft Teams' : wh.platform}
												</span>
											</td>
											<td>{wh.channel_name || <span className="text-muted">—</span>}</td>
											<td className="text-center">
												<div className="form-check form-switch d-inline-block m-0">
													<input
														className="form-check-input"
														type="checkbox"
														role="switch"
														aria-label={`${wh.channel_name || wh.platform} ${t('shared.active')}`}
														checked={Boolean(wh.is_active)}
														disabled={busyId === wh.webhook_id}
														onChange={() => handleToggle(wh)}
													/>
												</div>
											</td>
											<td className="text-end">
												<Tooltip text={t('adminIntegrations.test')}>
													<Button size="sm" variant="outlined" className="me-2" disabled={busyId === wh.webhook_id} aria-label={t('adminIntegrations.test')} onClick={() => handleTest(wh)}>
														<Icon name="send" size={14} aria-hidden="true" />
													</Button>
												</Tooltip>
												<Tooltip text={t('shared.delete')}>
													<Button size="sm" variant="outlined" color="danger" disabled={busyId === wh.webhook_id} aria-label={t('shared.delete')} onClick={() => handleDelete(wh)}>
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

			{modalOpen && (
				<Modal
					title={t('adminIntegrations.newWebhook')}
					onClose={() => setModalOpen(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setModalOpen(false)}>{t('shared.cancel')}</Button>
							<Button loading={saving} onClick={handleSubmit}>{t('shared.create')}</Button>
						</>
					}
				>
					<form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						{errors.form && <div className="alert alert-danger mb-0" role="alert">{errors.form}</div>}
						<p className={styles.help}>{t('adminIntegrations.help')}</p>
						<FormInput
							label={t('adminIntegrations.channel')}
							name="channelName"
							value={form.channelName}
							onChange={handleChange}
							placeholder={t('adminIntegrations.channelPlaceholder')}
						/>
						<FormInput
							label={t('adminIntegrations.webhookUrl')}
							name="webhookUrl"
							value={form.webhookUrl}
							onChange={handleChange}
							error={errors.webhookUrl}
							placeholder="https://..."
							required
						/>
					</form>
				</Modal>
			)}

			<SaveToast open={Boolean(toast)} message={toast} onClose={() => setToast('')} />
		</div>
	);
}
