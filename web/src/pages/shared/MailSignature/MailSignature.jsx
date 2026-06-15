import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getEarnedBadges } from '../../../services/pointsService';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Button from '../../../components/Button/Button';
import FormAlert from '../../../components/FormAlert/FormAlert';
import SaveToast from '../../../components/SaveToast/SaveToast';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './MailSignature.module.css';

const ROLE_KEY = {
	Consultant: 'consultant',
	'Talent Manager': 'tm',
	'Service Line Leader': 'sll',
	Administrator: 'admin',
};

function verifyUrl(link) {
	return `${window.location.origin}/verify/${link}`;
}

// Builds the signature HTML. Badges are only included for consultants.
function buildSignatureHtml(name, role, email, badges) {
	const items = badges
		.filter((b) => b.verificationLink && b.badge?.imageUrl)
		.map((b) =>
			`<a href="${verifyUrl(b.verificationLink)}" target="_blank" rel="noopener" style="text-decoration:none;margin-right:8px;display:inline-block;">` +
			`<img src="${b.badge.imageUrl}" alt="${b.badge.title || 'Badge'}" height="56" width="56" style="border:0;border-radius:8px;vertical-align:middle;" />` +
			`</a>`
		)
		.join('');

	const emailRow = email
		? `<tr><td style="font-size:12px;padding-top:4px;"><a href="mailto:${email}" style="color:#2575bd;text-decoration:none;">${email}</a></td></tr>`
		: '';
	const badgeRow = items ? `<tr><td style="padding-top:10px;">${items}</td></tr>` : '';

	return (
		`<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">` +
		`<tr><td style="font-size:15px;font-weight:bold;">${name}</td></tr>` +
		`<tr><td style="font-size:12px;color:#6b7280;padding-top:2px;">${role} · Softinsa</td></tr>` +
		emailRow +
		badgeRow +
		`</table>`
	);
}

export default function MailSignature() {
	const { t } = useTranslation();
	const { user, displayName } = useUser();
	// Per the project rules, only consultants may place badges in the signature.
	const isConsultant = user?.role === 'Consultant';
	const roleLabel = t(`mailSignature.role.${ROLE_KEY[user?.role] || 'consultant'}`, { defaultValue: user?.role || '' });
	const email = user?.email || user?.email_address || '';

	const [badges, setBadges] = useState([]);
	const [selected, setSelected] = useState(() => new Set());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [toast, setToast] = useState('');

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				if (!isConsultant) { if (active) setBadges([]); return; }
				const { badges: rows } = await getEarnedBadges({ page: 1, limit: 50 });
				if (!active) return;
				setBadges(rows);
				setSelected(new Set(rows.filter((b) => b.verificationLink).map((b) => b.awardedBadgeId)));
			} catch (err) {
				if (active) setError(resolveErrorMessage(err));
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, [isConsultant]);

	const selectedBadges = useMemo(
		() => (isConsultant ? badges.filter((b) => selected.has(b.awardedBadgeId)) : []),
		[isConsultant, badges, selected]
	);

	const signatureHtml = useMemo(
		() => buildSignatureHtml(displayName || '', roleLabel, email, selectedBadges),
		[displayName, roleLabel, email, selectedBadges]
	);

	function toggle(id) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	}

	// Copies the rendered signature (text/html) so it pastes formatted into
	// Gmail/Outlook; falls back to copying the raw HTML source.
	async function copySignature() {
		try {
			if (window.ClipboardItem && navigator.clipboard?.write) {
				const item = new window.ClipboardItem({
					'text/html': new Blob([signatureHtml], { type: 'text/html' }),
					'text/plain': new Blob([`${displayName} · Softinsa`], { type: 'text/plain' }),
				});
				await navigator.clipboard.write([item]);
			} else {
				await navigator.clipboard.writeText(signatureHtml);
			}
			setToast(t('mailSignature.copied'));
		} catch {
			setError(t('mailSignature.copyFailed'));
		}
	}

	async function copyHtmlSource() {
		try {
			await navigator.clipboard.writeText(signatureHtml);
			setToast(t('mailSignature.copiedHtml'));
		} catch {
			setError(t('mailSignature.copyFailed'));
		}
	}

	if (loading) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('mailSignature.title')}</h1>
				<CardGridSkeleton count={2} columns={2} />
			</div>
		);
	}

	const usableBadges = badges.filter((b) => b.verificationLink && b.badge?.imageUrl);
	const gmailSteps = t('mailSignature.gmailSteps', { returnObjects: true });
	const outlookSteps = t('mailSignature.outlookSteps', { returnObjects: true });

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('mailSignature.title')}</h1>
			<p className={styles.subtitle}>{t('mailSignature.subtitle')}</p>

			<FormAlert message={error} variant="danger" />

			<div className={styles.grid}>
				{/* Badge selection — consultants only */}
				{isConsultant && (
					<ContentCard className={styles.card}>
						<CardHeader icon="badge" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('mailSignature.selectBadges')} />
						{usableBadges.length === 0 ? (
							<p className={styles.emptyText}>{t('mailSignature.empty')}</p>
						) : (
							<ul className={styles.badgeList}>
								{usableBadges.map((b) => {
									const checked = selected.has(b.awardedBadgeId);
									return (
										<li key={b.awardedBadgeId}>
											<label className={`${styles.badgeRow} ${checked ? styles.badgeRowActive : ''}`}>
												<input type="checkbox" className="form-check-input" checked={checked} onChange={() => toggle(b.awardedBadgeId)} />
												<img src={b.badge.imageUrl} alt={b.badge.title} className={styles.badgeThumb} />
												<span className={styles.badgeName}>{b.badge.title}</span>
											</label>
										</li>
									);
								})}
							</ul>
						)}
					</ContentCard>
				)}

				{/* Preview + copy */}
				<ContentCard className={styles.card}>
					<CardHeader icon="email" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('mailSignature.preview')} />
					{!isConsultant && <p className={styles.note}>{t('mailSignature.noBadgesNote')}</p>}
					<div className={styles.previewBox}>
						<div className={styles.preview} dangerouslySetInnerHTML={{ __html: signatureHtml }} />
					</div>
					<div className={styles.actions}>
						<Button variant="filled" color="primary" size="sm" onClick={copySignature}>
							<Icon name="check_circle" size={16} /> {t('mailSignature.copySignature')}
						</Button>
						<Button variant="outlined" color="primary" size="sm" onClick={copyHtmlSource}>
							<Icon name="link" size={16} /> {t('mailSignature.copyHtml')}
						</Button>
					</div>
				</ContentCard>
			</div>

			{/* Instructions */}
			<h2 className={styles.sectionTitle}>{t('mailSignature.instructionsTitle')}</h2>
			<div className={styles.grid}>
				<ContentCard className={styles.card}>
					<CardHeader icon="email" iconBg="var(--color-red-soft)" iconColor="var(--color-red-on-soft)" title="Gmail" />
					<ol className={styles.steps}>
						{(Array.isArray(gmailSteps) ? gmailSteps : []).map((s, i) => <li key={i}>{s}</li>)}
					</ol>
				</ContentCard>
				<ContentCard className={styles.card}>
					<CardHeader icon="email" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title="Outlook" />
					<ol className={styles.steps}>
						{(Array.isArray(outlookSteps) ? outlookSteps : []).map((s, i) => <li key={i}>{s}</li>)}
					</ol>
				</ContentCard>
			</div>

			<details className={styles.htmlDetails}>
				<summary className={styles.htmlSummary}>{t('mailSignature.showHtml')}</summary>
				<textarea className={styles.htmlArea} readOnly rows={6} value={signatureHtml} />
			</details>

			<SaveToast open={Boolean(toast)} message={toast} onClose={() => setToast('')} />
		</div>
	);
}
