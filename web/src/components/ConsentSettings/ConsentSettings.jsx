import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLatestPolicy, getConsentHistory, recordConsent } from '../../features/gdpr/api/gdprApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import Button from '../Button/Button';
import styles from './ConsentSettings.module.css';

// Lets the user see and withdraw the sharing consent they previously gave (GDPR
// Art. 7(3): consent must be as easy to withdraw as to give). Self-contained and
// safe to drop into Settings; renders a compact status + revoke control.
export default function ConsentSettings() {
	// Translation helper
	const { t } = useTranslation();
	// Latest Privacy policy (the one consent is tracked against)
	const [policy, setPolicy] = useState(null);
	// Whether the user's most recent decision for that policy is ACCEPTED
	const [accepted, setAccepted] = useState(false);
	// Initial load flag
	const [loading, setLoading] = useState(true);
	// In-flight revoke flag
	const [revoking, setRevoking] = useState(false);
	// Error message to display
	const [error, setError] = useState(null);
	// Transient confirmation after a successful revoke
	const [revoked, setRevoked] = useState(false);

	// Load the latest policy and the user's current consent state for it
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [latest, history] = await Promise.all([
				getLatestPolicy('Privacy'),
				getConsentHistory().catch(() => []),
			]);
			setPolicy(latest);
			// History is most-recent-first: the first entry for this policy is current.
			const current = (history || []).find((h) => h.policy_id === latest?.policy_id);
			setAccepted(current?.action === 'ACCEPTED');
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch on mount
	useEffect(() => { load(); }, [load]);

	// Withdraw consent for the current Privacy policy
	async function revoke() {
		if (!policy) return;
		setRevoking(true);
		setError(null);
		try {
			await recordConsent(policy.policy_id, 'REVOKED');
			setAccepted(false);
			setRevoked(true);
		} catch (err) {
			setError(t('settings.consentRevokeFailed'));
		} finally {
			setRevoking(false);
		}
	}

	// No policy configured → nothing to manage.
	if (!loading && !policy) return null;

	return (
		<ContentCard className={styles.section}>
			<CardHeader icon="privacy" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('settings.consentTitle')} />
			<p className={styles.hint}>{t('settings.consentHint')}</p>
			{error && <div className="alert alert-danger" role="alert">{error}</div>}
			{!loading && (
				accepted ? (
					<div className={styles.row}>
						<span className={styles.status}>{t('settings.consentAcceptedOn', { version: policy?.version })}</span>
						<Button variant="outlined" color="danger" size="sm" onClick={revoke} loading={revoking}>
							{t('settings.consentRevoke')}
						</Button>
					</div>
				) : (
					<p className={styles.note}>{revoked ? t('settings.consentRevoked') : t('settings.consentNone')}</p>
				)
			)}
		</ContentCard>
	);
}
