import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getGlobalPreferences, updateGlobalPreference } from '../../../features/notifications/api/notificationsAdminApi';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Tooltip from '../../../components/Tooltip/Tooltip';
import styles from './AdminNotifications.module.css';

const TOGGLE_FIELDS = ['is_enabled', 'send_email', 'send_push'];

// Only the notifications the platform actually sends are configurable here.
// The order drives the display order; unused/dead definitions are hidden.
const ESSENTIAL_CODES = [
	'ANNOUNCEMENT_PUBLISHED',
	'APPLICATION_SUBMITTED',
	'APPLICATION_APPROVED',
	'APPLICATION_REJECTED',
	'OBJECTIVE_DUE',
	'BADGE_EXPIRING_SOON',
	'BADGE_EXPIRED',
	'SLA_BREACH',
];
// Sent only in-app / push (no email channel).
const EMAIL_INCAPABLE = new Set(['ANNOUNCEMENT_PUBLISHED']);

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

	// Show only the essential/functional notifications, in the defined order.
	const visiblePrefs = useMemo(() => {
		const order = new Map(ESSENTIAL_CODES.map((c, i) => [c, i]));
		return prefs
			.filter((p) => order.has(p.definition?.code))
			.sort((a, b) => order.get(a.definition.code) - order.get(b.definition.code));
	}, [prefs]);

	const labelFor = (pref) => t(`notifDefs.${pref.definition?.code}.name`, { defaultValue: pref.definition?.name || pref.definition?.code || `#${pref.definition_id}` });
	const descFor = (pref) => t(`notifDefs.${pref.definition?.code}.desc`, { defaultValue: pref.definition?.description || '' });

	async function toggle(pref, field) {
		const id = pref.preference_id;
		const next = !pref[field];
		setSavingId(id);
		setError('');
		setPrefs((prev) => prev.map((p) => (p.preference_id === id ? { ...p, [field]: next } : p)));
		try {
			await updateGlobalPreference(id, { [field]: next });
		} catch (err) {
			console.error(err);
			setError(t('adminNotifications.saveFailed'));
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
					) : visiblePrefs.length === 0 ? (
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
									{visiblePrefs.map((pref) => {
										const code = pref.definition?.code;
										return (
											<tr key={pref.preference_id} className={savingId === pref.preference_id ? styles.saving : ''}>
												<td>
													<div className={styles.name}>{labelFor(pref)}</div>
													{descFor(pref) && <div className={`small text-muted ${styles.desc}`}>{descFor(pref)}</div>}
												</td>
												{TOGGLE_FIELDS.map((field) => {
													if (field === 'send_email' && EMAIL_INCAPABLE.has(code)) {
														return (
															<td key={field} className="text-center">
																<Tooltip text={t('adminNotifications.noEmailChannel')}>
																	<span className="text-muted">—</span>
																</Tooltip>
															</td>
														);
													}
													return (
														<td key={field} className="text-center">
															<div className="form-check form-switch d-inline-block m-0">
																<input
																	className="form-check-input"
																	type="checkbox"
																	role="switch"
																	aria-label={`${labelFor(pref)} ${field}`}
																	checked={Boolean(pref[field])}
																	disabled={savingId === pref.preference_id}
																	onChange={() => toggle(pref, field)}
																/>
															</div>
														</td>
													);
												})}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
