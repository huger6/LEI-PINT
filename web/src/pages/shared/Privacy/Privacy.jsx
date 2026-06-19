import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getConsentHistory, requestDataExport, requestAccountDeletion } from '../../../features/gdpr/api/gdprApi';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { AUTH } from '../../../routes/paths';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import styles from './Privacy.module.css';

function formatDateTime(value) {
	if (!value) return '—';
	return new Date(value).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Privacy() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { logout } = useAuth();

	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [exporting, setExporting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setHistory(await getConsentHistory() || []);
		} catch {
			setHistory([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	async function handleExport() {
		setExporting(true);
		setError('');
		try {
			const data = await requestDataExport();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `os-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch {
			setError(t('privacy.exportFailed'));
		} finally {
			setExporting(false);
		}
	}

	async function handleDelete() {
		setDeleting(true);
		setError('');
		try {
			await requestAccountDeletion();
			await logout();
			navigate(AUTH.LOGIN, { replace: true });
		} catch {
			setError(t('privacy.deleteFailed'));
			setDeleting(false);
			setConfirmDelete(false);
		}
	}

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>{t('privacy.title')}</h1>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<ContentCard className={styles.section}>
				<CardHeader icon="download" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('privacy.exportTitle')} />
				<p className={styles.hint}>{t('privacy.exportHint')}</p>
				<div>
					<Button variant="outlined" color="primary" loading={exporting} onClick={handleExport}>
						{t('privacy.exportButton')}
					</Button>
				</div>
			</ContentCard>

			<ContentCard className={styles.section}>
				<CardHeader icon="privacy" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('privacy.historyTitle')} />
				{loading ? (
					<TableSkeleton rows={3} columns={3} />
				) : history.length === 0 ? (
					<p className={styles.hint}>{t('privacy.historyEmpty')}</p>
				) : (
					<div className="table-responsive">
						<table className="table align-middle mb-0">
							<thead>
								<tr>
									<th>{t('privacy.policy')}</th>
									<th>{t('privacy.action')}</th>
									<th>{t('privacy.date')}</th>
								</tr>
							</thead>
							<tbody>
								{history.map((h) => (
									<tr key={h.consent_id}>
										<td>{h.policy?.policy_type ? `${h.policy.policy_type} ${h.policy.version || ''}`.trim() : '—'}</td>
										<td>
											<span className={`${styles.actionChip} ${h.action === 'ACCEPTED' ? styles.accepted : styles.revoked}`}>
												{t(`privacy.actions.${h.action}`, { defaultValue: h.action })}
											</span>
										</td>
										<td className="text-muted">{formatDateTime(h.consented_at)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</ContentCard>

			<ContentCard className={`${styles.section} ${styles.danger}`}>
				<CardHeader icon="trash" iconBg="var(--color-red-soft)" iconColor="var(--color-red-on-soft)" title={t('privacy.deleteTitle')} />
				<p className={styles.hint}>{t('privacy.deleteHint')}</p>
				<div>
					<Button color="danger" onClick={() => setConfirmDelete(true)}>{t('privacy.deleteButton')}</Button>
				</div>
			</ContentCard>

			{confirmDelete && (
				<Modal
					title={t('privacy.deleteTitle')}
					size="sm"
					onClose={() => !deleting && setConfirmDelete(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setConfirmDelete(false)} disabled={deleting}>{t('shared.cancel')}</Button>
							<Button color="danger" loading={deleting} onClick={handleDelete}>{t('privacy.deleteConfirm')}</Button>
						</>
					}
				>
					<p className="mb-0">{t('privacy.deleteWarning')}</p>
				</Modal>
			)}
		</div>
	);
}
