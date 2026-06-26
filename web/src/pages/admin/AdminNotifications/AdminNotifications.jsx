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
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Store the global notification preference rows.
	const [prefs, setPrefs] = useState([]);
	// Track whether preferences are still loading.
	const [loading, setLoading] = useState(true);
	// Track the preference ID currently being saved to disable its row.
	const [savingId, setSavingId] = useState(null);
	// Hold any page-level error message.
	const [error, setError] = useState('');

	// Fetch all global notification preferences from the API.
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

	// Load preferences on mount and whenever load changes.
	useEffect(() => { load(); }, [load]);

	// Show only the essential/functional notifications, one row per definition
	// (lowest preference_id wins if the data has duplicates), in the defined order.
	const visiblePrefs = useMemo(() => {
		const order = new Map(ESSENTIAL_CODES.map((c, i) => [c, i]));
		const seen = new Set();
		return prefs
			.filter((p) => order.has(p.definition?.code))
			.sort((a, b) => (a.preference_id ?? 0) - (b.preference_id ?? 0))
			.filter((p) => {
				if (seen.has(p.definition_id)) return false;
				seen.add(p.definition_id);
				return true;
			})
			.sort((a, b) => order.get(a.definition.code) - order.get(b.definition.code));
	}, [prefs]);

	// Resolve the display label for a notification preference.
	const labelFor = (pref) => t(`notifDefs.${pref.definition?.code}.name`, { defaultValue: pref.definition?.name || pref.definition?.code || `#${pref.definition_id}` });
	// Resolve the description text for a notification preference.
	const descFor = (pref) => t(`notifDefs.${pref.definition?.code}.desc`, { defaultValue: pref.definition?.description || '' });

	// Optimistically toggle a preference field and revert on API failure.
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
