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

// Brand logos for the e-mail client instruction cards (multicolour SVGs, so they
// cannot use the mono-stroke Icon component).
const gmailIcon = (
	<svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
		<path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75L35 40h7a3 3 0 0 0 3-3z" />
		<path fill="#1e88e5" d="M3 16.2l3.614 1.71L13 23.7V40H6a3 3 0 0 1-3-3z" />
		<path fill="#e53935" d="M35 11.2L24 19.45 13 11.2 12 17l1 6.7L24 32l11-8.3L36 17z" />
		<path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.298 4.298 0 0 0 3 12.298z" />
		<path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.298 4.298 0 0 1 45 12.298z" />
	</svg>
);

const outlookIcon = (
	<svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
		<path fill="#0a4dae" d="M27 12h15.5A1.5 1.5 0 0 1 44 13.5v21a1.5 1.5 0 0 1-1.5 1.5H27z" />
		<path fill="#fff" d="M30 17h11v2.4l-5.5 3.6L30 19.4z" />
		<path fill="#cfe4fb" d="M30 20.6l5.5 3.4 5.5-3.4V31H30z" />
		<rect x="3" y="13" width="25" height="22" rx="3" fill="#0078d4" />
		<path fill="#fff" d="M15.4 18c-3.2 0-5.5 2.5-5.5 6s2.3 6 5.5 6 5.5-2.5 5.5-6-2.3-6-5.5-6zm0 2.5c1.9 0 3 1.6 3 3.5s-1.1 3.5-3 3.5-3-1.6-3-3.5 1.1-3.5 3-3.5z" />
	</svg>
);

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
						<Button variant="filled" color="primary" size="md" onClick={copySignature}>
							<Icon name="check_circle" size={18} /> {t('mailSignature.copySignature')}
						</Button>
					</div>
				</ContentCard>
			</div>

			{/* Instructions */}
			<h2 className={styles.sectionTitle}>{t('mailSignature.instructionsTitle')}</h2>
			<div className={styles.grid}>
				<ContentCard className={styles.card}>
					<CardHeader iconNode={gmailIcon} iconBg="#fff" title="Gmail" />
					<ol className={styles.steps}>
						{(Array.isArray(gmailSteps) ? gmailSteps : []).map((s, i) => <li key={i}>{s}</li>)}
					</ol>
				</ContentCard>
				<ContentCard className={styles.card}>
					<CardHeader iconNode={outlookIcon} iconBg="#fff" title="Outlook" />
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
