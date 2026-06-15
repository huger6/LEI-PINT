import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getGlobalPreferences, updateGlobalPreference } from '../../../features/notifications/api/notificationsAdminApi';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import styles from './AdminNotifications.module.css';

const TOGGLE_FIELDS = ['is_enabled', 'send_email', 'send_push'];

export default function AdminNotifications() {
	const { t } = useTranslation();
	const [prefs, setPrefs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [savingId, setSavingId] = useState(null);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getGlobalPreferences();
			setPrefs(data || []);
		} catch (err) {
			console.error(err);
			setError(t('adminNotifications.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => { load(); }, [load]);

	async function toggle(pref, field) {
		const id = pref.preference_id;
		const next = !pref[field];
		setSavingId(id);
		setError('');
		// Optimistic update.
		setPrefs((prev) => prev.map((p) => (p.preference_id === id ? { ...p, [field]: next } : p)));
		try {
			await updateGlobalPreference(id, { [field]: next });
		} catch (err) {
			console.error(err);
			setError(t('adminNotifications.saveFailed'));
			// Revert on failure.
			setPrefs((prev) => prev.map((p) => (p.preference_id === id ? { ...p, [field]: !next } : p)));
		} finally {
			setSavingId(null);
		}
	}

	return (
		<div>
			<h1 className="h3 mb-1">{t('adminNotifications.title')}</h1>
			<p className="text-muted mb-4">{t('adminNotifications.subtitle')}</p>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={6} columns={4} />
					) : prefs.length === 0 ? (
						<p className="text-muted small mb-0">{t('adminNotifications.empty')}</p>
					) : (
						<div className="table-responsive">
							<table className="table align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('adminNotifications.notification')}</th>
										<th className="text-center">{t('adminNotifications.enabled')}</th>
										<th className="text-center">{t('adminNotifications.email')}</th>
										<th className="text-center">{t('adminNotifications.push')}</th>
									</tr>
								</thead>
								<tbody>
									{prefs.map((pref) => (
										<tr key={pref.preference_id} className={savingId === pref.preference_id ? styles.saving : ''}>
											<td>
												<div className={styles.name}>{pref.definition?.name || pref.definition?.code || `#${pref.definition_id}`}</div>
												{pref.definition?.description && (
													<div className={`small text-muted ${styles.desc}`}>{pref.definition.description}</div>
												)}
											</td>
											{TOGGLE_FIELDS.map((field) => (
												<td key={field} className="text-center">
													<div className="form-check form-switch d-inline-block m-0">
														<input
															className="form-check-input"
															type="checkbox"
															role="switch"
															aria-label={`${pref.definition?.name || ''} ${field}`}
															checked={Boolean(pref[field])}
															disabled={savingId === pref.preference_id}
															onChange={() => toggle(pref, field)}
														/>
													</div>
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
