import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal';
import Button from '../Button';
import Spinner from '../Spinner/Spinner';
import Icon from '../Icons/Icons';
import { getLatestPolicy, getConsentHistory, recordConsent } from '../../features/gdpr/api/gdprApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import styles from './GdprConsentModal.module.css';

/** GDPR consent modal shown to consultants who haven't yet accepted the data privacy terms. */
export default function GdprConsentModal({ policyType = 'Privacy', purpose, onConfirm, onClose }) {
	const { t } = useTranslation();
	// Holds the fetched policy object to display.
	const [policy, setPolicy] = useState(null);
	// Tracks whether the policy is still being fetched.
	const [loading, setLoading] = useState(true);
	// Stores any error message from fetching or submitting consent.
	const [error, setError] = useState('');
	// Tracks whether the user has checked the agreement checkbox.
	const [agreed, setAgreed] = useState(false);
	// Tracks whether the consent submission is in progress.
	const [saving, setSaving] = useState(false);

	// Fetches the latest policy and consent history; skips the modal if already accepted.
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const [latest, history] = await Promise.all([
					getLatestPolicy(policyType),
					getConsentHistory().catch(() => []),
				]);
				if (!active) return;

				// History is most-recent-first, so the first entry for this policy is
				// the current state — this way a later REVOKED overrides an earlier
				// ACCEPTED and the user is correctly asked to consent again.
				const latestForPolicy = history.find((h) => h.policy_id === latest?.policy_id);
				const alreadyAccepted = latestForPolicy?.action === 'ACCEPTED';
				if (alreadyAccepted) {
					onConfirm();
					onClose();
					return;
				}
				setPolicy(latest);
			} catch (err) {
				if (active) setError(resolveErrorMessage(err));
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [policyType]);

	// Records the user's consent and closes the modal on success.
	async function handleAccept() {
		if (!policy || !agreed) return;
		setSaving(true);
		setError('');
		try {
			await recordConsent(policy.policy_id, 'ACCEPTED');
			onConfirm();
			onClose();
		} catch (err) {
			setError(resolveErrorMessage(err));
			setSaving(false);
		}
	}

	const footer = !loading && !error && policy && (
		<>
			<Button variant="outlined" onClick={onClose} disabled={saving}>
				{t('shared.cancel')}
			</Button>
			<Button onClick={handleAccept} loading={saving} disabled={!agreed}>
				{t('gdprConsent.acceptAndContinue')}
			</Button>
		</>
	);

	return (
		<Modal title={t('gdprConsent.title')} onClose={onClose} footer={footer} size="lg">
			{loading ? (
				<Spinner />
			) : error ? (
				<div className="alert alert-danger mb-0" role="alert">{error}</div>
			) : policy ? (
				<div className={styles.wrap}>
					{purpose && (
						<div className={styles.purpose}>
							<Icon name="privacy" size={18} color="var(--color-primary)" aria-hidden="true" />
							<span>{purpose}</span>
						</div>
					)}
					<div className={styles.meta}>
						{t('gdprConsent.version', { version: policy.version })}
					</div>
					<div className={styles.policyText}>{policy.policy_text}</div>
					<label className={styles.agree}>
						<input
							type="checkbox"
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
						/>
						<span>{t('gdprConsent.agreeLabel')}</span>
					</label>
				</div>
			) : null}
		</Modal>
	);
}

GdprConsentModal.propTypes = {
	policyType: PropTypes.oneOf(['Privacy', 'Terms', 'Cookies']),
	purpose: PropTypes.string,
	onConfirm: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
};
