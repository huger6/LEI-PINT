import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserPreferences, updateUserPreference } from '../../features/notifications/api/notificationsApi';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import Tooltip from '../Tooltip/Tooltip';
import styles from './NotificationPreferences.module.css';

// Only the notifications the platform actually sends, in display order.
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
// Delivered only in-app / push (no e-mail channel).
const EMAIL_INCAPABLE = new Set(['ANNOUNCEMENT_PUBLISHED']);

/** User notification preferences panel for toggling email/push notifications per category. */
export default function NotificationPreferences() {
	const { t } = useTranslation();
	const [prefs, setPrefs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [savingId, setSavingId] = useState(null);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setLoading(true);
		try {
			setPrefs(await getUserPreferences());
		} catch (err) {
			console.error(err);
			setError(t('notifPrefs.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => { load(); }, [load]);

	const visible = useMemo(() => {
		const order = new Map(ESSENTIAL_CODES.map((c, i) => [c, i]));
		return prefs
			.filter((p) => order.has(p.code))
			.sort((a, b) => order.get(a.code) - order.get(b.code));
	}, [prefs]);

	const labelFor = (p) => t(`notifDefs.${p.code}.name`, { defaultValue: p.name || p.code });
	const descFor = (p) => t(`notifDefs.${p.code}.desc`, { defaultValue: p.description || '' });

	async function toggle(pref, field) {
		const id = pref.definition_id;
		const next = !pref.effective?.[field];
		setSavingId(id);
		setError('');
		setPrefs((prev) => prev.map((p) => (p.definition_id === id
			? { ...p, effective: { ...p.effective, [field]: next } }
			: p)));
		try {
			await updateUserPreference(id, { [field]: next });
		} catch (err) {
			console.error(err);
			setError(t('notifPrefs.saveFailed'));
			setPrefs((prev) => prev.map((p) => (p.definition_id === id
				? { ...p, effective: { ...p.effective, [field]: !next } }
				: p)));
		} finally {
			setSavingId(null);
		}
	}

	return (
		<ContentCard className={styles.section}>
			<CardHeader icon="bell" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('notifPrefs.title')} />
			<p className={styles.hint}>{t('notifPrefs.hint')}</p>

			{error && <div className="alert alert-danger py-2 px-3 mb-2" role="alert">{error}</div>}

			{loading ? (
				<p className={styles.empty}>—</p>
			) : visible.length === 0 ? (
				<p className={styles.empty}>{t('notifPrefs.empty')}</p>
			) : (
				<div className="table-responsive">
					<table className="table align-middle mb-0">
						<thead className="table-light">
							<tr>
								<th>{t('notifPrefs.notification')}</th>
								<th className="text-center">{t('notifPrefs.enabled')}</th>
								<th className="text-center">{t('notifPrefs.email')}</th>
							</tr>
						</thead>
						<tbody>
							{visible.map((pref) => {
								const busy = savingId === pref.definition_id;
								const enabled = Boolean(pref.effective?.is_enabled);
								return (
									<tr key={pref.definition_id}>
										<td>
											<div className={styles.name}>{labelFor(pref)}</div>
											{descFor(pref) && <div className={`small text-muted ${styles.desc}`}>{descFor(pref)}</div>}
										</td>
										<td className="text-center">
											<div className="form-check form-switch d-inline-block m-0">
												<input
													className="form-check-input"
													type="checkbox"
													role="switch"
													aria-label={`${labelFor(pref)} ${t('notifPrefs.enabled')}`}
													checked={enabled}
													disabled={busy}
													onChange={() => toggle(pref, 'is_enabled')}
												/>
											</div>
										</td>
										<td className="text-center">
											{EMAIL_INCAPABLE.has(pref.code) ? (
												<Tooltip text={t('notifPrefs.noEmailChannel')}>
													<span className="text-muted">—</span>
												</Tooltip>
											) : (
												<div className="form-check form-switch d-inline-block m-0">
													<input
														className="form-check-input"
														type="checkbox"
														role="switch"
														aria-label={`${labelFor(pref)} ${t('notifPrefs.email')}`}
														checked={Boolean(pref.effective?.send_email) && enabled}
														disabled={busy || !enabled}
														onChange={() => toggle(pref, 'send_email')}
													/>
												</div>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</ContentCard>
	);
}
