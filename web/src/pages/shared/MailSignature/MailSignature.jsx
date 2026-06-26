import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getEarnedBadges } from '../../../services/pointsService';
import { useUser } from '../../../hooks/userContext';
import { useGdprConsent } from '../../../context/GdprConsentContext';
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

// Builds the public verification URL for a badge from its verification link
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
// `opts` toggles the profile photo and the name (the user can pick photo, name
// or both — defaults to both).
function buildSignatureHtml(name, role, email, badges, photoUrl, opts = {}) {
	const { showPhoto = true, showName = true } = opts;
	const items = badges
		.map((b) => {
			const link = b.verificationLink ? verifyUrl(b.verificationLink) : null;
			const img = b.badge?.imageUrl;
			const title = b.badge?.title || 'Badge';
			if (img) {
				const imgTag = `<img src="${img}" alt="${title}" height="56" width="56" style="border:0;border-radius:8px;vertical-align:middle;" />`;
				return link
					? `<a href="${link}" target="_blank" rel="noopener" style="text-decoration:none;margin-right:8px;display:inline-block;">${imgTag}</a>`
					: `<span style="margin-right:8px;display:inline-block;">${imgTag}</span>`;
			}
			// No image: fall back to a small text chip (linked when published).
			const chip = `<span style="display:inline-block;padding:4px 10px;margin-right:8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;color:#1f2937;">${title}</span>`;
			return link ? `<a href="${link}" target="_blank" rel="noopener" style="text-decoration:none;">${chip}</a>` : chip;
		})
		.join('');

	const emailRow = email
		? `<tr><td style="font-size:12px;padding-top:4px;"><a href="mailto:${email}" style="color:#2575bd;text-decoration:none;">${email}</a></td></tr>`
		: '';
	const badgeRow = items ? `<tr><td style="padding-top:10px;">${items}</td></tr>` : '';
	const nameRow = showName ? `<tr><td style="font-size:15px;font-weight:bold;">${name}</td></tr>` : '';

	const infoTable =
		`<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">` +
		nameRow +
		`<tr><td style="font-size:12px;color:#6b7280;padding-top:2px;">${role} · Softinsa</td></tr>` +
		emailRow +
		badgeRow +
		`</table>`;

	if (showPhoto && photoUrl) {
		return (
			`<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><tr>` +
			`<td style="padding-right:12px;vertical-align:middle;"><img src="${photoUrl}" alt="${name}" width="64" height="64" style="border:0;border-radius:50%;object-fit:cover;display:block;" /></td>` +
			`<td style="vertical-align:middle;">${infoTable}</td>` +
			`</tr></table>`
		);
	}

	return infoTable;
}

// Builds a full e-mail body template showcasing the consultant's badges
// (BÓNUS: "template de email com badges"). Each badge is a card with its image,
// title and a public verification link. `strings` carries the localized copy.
function buildEmailTemplateHtml(name, role, email, badges, photoUrl, opts = {}) {
	const { showPhoto = true, showName = true, intro = '', closing = '', verifyLabel = 'Verify' } = opts;

	const cards = badges.map((b) => {
		const link = b.verificationLink ? verifyUrl(b.verificationLink) : null;
		const img = b.badge?.imageUrl;
		const title = b.badge?.title || 'Badge';
		const imgTag = img
			? `<img src="${img}" alt="${title}" width="84" height="84" style="border:0;border-radius:12px;display:block;margin:0 auto;" />`
			: `<div style="width:84px;height:84px;border-radius:12px;background:#eef2f7;margin:0 auto;"></div>`;
		const verify = link
			? `<a href="${link}" target="_blank" rel="noopener" style="font-size:11px;color:#2575bd;text-decoration:none;">${verifyLabel}</a>`
			: '';
		return `<td style="padding:8px;text-align:center;vertical-align:top;width:120px;">${imgTag}<div style="font-size:12px;font-weight:bold;color:#1f2937;padding-top:6px;">${title}</div><div style="padding-top:2px;">${verify}</div></td>`;
	});

	const rows = [];
	for (let i = 0; i < cards.length; i += 3) {
		rows.push(`<tr>${cards.slice(i, i + 3).join('')}</tr>`);
	}
	const grid = rows.length
		? `<table cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows.join('')}</table>`
		: '';

	const header =
		`<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;"><tr>` +
		(showPhoto && photoUrl ? `<td style="padding-right:12px;vertical-align:middle;"><img src="${photoUrl}" alt="${name}" width="56" height="56" style="border:0;border-radius:50%;object-fit:cover;display:block;" /></td>` : '') +
		`<td style="vertical-align:middle;">` +
		(showName ? `<div style="font-size:16px;font-weight:bold;color:#1f2937;">${name}</div>` : '') +
		`<div style="font-size:12px;color:#6b7280;">${role} · Softinsa</div>` +
		`</td></tr></table>`;

	return (
		`<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:520px;">` +
		header +
		(intro ? `<p style="font-size:14px;line-height:1.5;color:#374151;">${intro}</p>` : '') +
		grid +
		(closing ? `<p style="font-size:14px;line-height:1.5;color:#374151;">${closing}</p>` : '') +
		(showName ? `<p style="font-size:14px;font-weight:bold;color:#1f2937;margin:4px 0 0;">${name}</p>` : '') +
		(email ? `<p style="margin:2px 0 0;"><a href="mailto:${email}" style="font-size:12px;color:#2575bd;text-decoration:none;">${email}</a></p>` : '') +
		`</div>`
	);
}

// Page for generating an e-mail signature / template embedding earned badges
export default function MailSignature() {
	// Translation helper
	const { t } = useTranslation();
	// Current user and their display name from context
	const { user, displayName } = useUser();
	// GDPR consent gate (sharing badges/credentials exposes personal data)
	const { requestConsent } = useGdprConsent();
	// Per the project rules, only consultants may place badges in the signature.
	const isConsultant = user?.role === 'Consultant';
	const roleLabel = t(`mailSignature.role.${ROLE_KEY[user?.role] || 'consultant'}`, { defaultValue: user?.role || '' });
	const email = user?.email || user?.email_address || '';
	const photoUrl = user?.profileImg || user?.profile_img_url || '';

	// 'signature' (BÓNUS 12) | 'email' (BÓNUS 23 — full e-mail body with badges).
	const [view, setView] = useState('signature');
	// Whether to include the profile photo in the output
	const [includePhoto, setIncludePhoto] = useState(true);
	// Whether to include the user's name in the output
	const [includeName, setIncludeName] = useState(true);
	// Earned badges fetched for the consultant
	const [badges, setBadges] = useState([]);
	// Set of selected badge ids to embed
	const [selected, setSelected] = useState(() => new Set());
	// Loading state for the initial badge fetch
	const [loading, setLoading] = useState(true);
	// Error message for fetch/copy failures
	const [error, setError] = useState(null);
	// Toast message shown after copying
	const [toast, setToast] = useState('');

	// Fetch earned badges on mount (consultants only) and pre-select published ones
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

	// Badges currently selected for inclusion (empty for non-consultants)
	const selectedBadges = useMemo(
		() => (isConsultant ? badges.filter((b) => selected.has(b.awardedBadgeId)) : []),
		[isConsultant, badges, selected]
	);

	// Rendered HTML for the compact e-mail signature
	const signatureHtml = useMemo(
		() => buildSignatureHtml(displayName || '', roleLabel, email, selectedBadges, photoUrl, { showPhoto: includePhoto, showName: includeName }),
		[displayName, roleLabel, email, selectedBadges, photoUrl, includePhoto, includeName]
	);

	// Rendered HTML for the full e-mail body template
	const emailHtml = useMemo(
		() => buildEmailTemplateHtml(displayName || '', roleLabel, email, selectedBadges, photoUrl, {
			showPhoto: includePhoto,
			showName: includeName,
			intro: t('mailSignature.email.intro'),
			closing: t('mailSignature.email.closing'),
			verifyLabel: t('mailSignature.email.verify'),
		}),
		[displayName, roleLabel, email, selectedBadges, photoUrl, includePhoto, includeName, t]
	);

	// Consultants can switch to the e-mail template; other roles only get the signature.
	const isEmailView = isConsultant && view === 'email';
	const activeHtml = isEmailView ? emailHtml : signatureHtml;

	// Toggles a badge id in/out of the selected set
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
		// Embedding earned badges in an outgoing signature/e-mail shares personal
		// credentials, so gate the copy behind RGPD consent (asked only once).
		if (isConsultant && selectedBadges.length > 0) {
			const ok = await requestConsent({
				policyType: 'Privacy',
				purpose: t('gdprConsent.shareSignaturePurpose'),
			});
			if (!ok) return;
		}
		try {
			if (window.ClipboardItem && navigator.clipboard?.write) {
				const item = new window.ClipboardItem({
					'text/html': new Blob([activeHtml], { type: 'text/html' }),
					'text/plain': new Blob([`${displayName} · Softinsa`], { type: 'text/plain' }),
				});
				await navigator.clipboard.write([item]);
			} else {
				await navigator.clipboard.writeText(activeHtml);
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

	// Show every earned badge so the consultant can pick any of them; the
	// signature handles missing images/links gracefully.
	const usableBadges = badges;
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
												{b.badge?.imageUrl
													? <img src={b.badge.imageUrl} alt={b.badge.title || ''} className={styles.badgeThumb} />
													: <span className={`${styles.badgeThumb} ${styles.badgeThumbFallback}`}><Icon name="badge" size={20} aria-hidden="true" /></span>}
												<span className={styles.badgeName}>{b.badge?.title || '—'}</span>
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
					{isConsultant && (
						<div className={styles.viewToggle} role="tablist" aria-label={t('mailSignature.viewLabel')}>
							<button
								type="button"
								role="tab"
								aria-selected={view === 'signature'}
								className={`${styles.viewBtn} ${view === 'signature' ? styles.viewBtnActive : ''}`}
								onClick={() => setView('signature')}
							>
								{t('mailSignature.viewSignature')}
							</button>
							<button
								type="button"
								role="tab"
								aria-selected={view === 'email'}
								className={`${styles.viewBtn} ${view === 'email' ? styles.viewBtnActive : ''}`}
								onClick={() => setView('email')}
							>
								{t('mailSignature.viewEmail')}
							</button>
						</div>
					)}
					<div className={styles.displayOptions}>
						<span className={styles.displayOptionsLabel}>{t('mailSignature.include')}</span>
						<label className={`form-check ${styles.optionCheck}`}>
							<input type="checkbox" className="form-check-input" checked={includePhoto} disabled={!photoUrl} onChange={(e) => setIncludePhoto(e.target.checked)} />
							<span className="form-check-label">{t('mailSignature.includePhoto')}</span>
						</label>
						<label className={`form-check ${styles.optionCheck}`}>
							<input type="checkbox" className="form-check-input" checked={includeName} onChange={(e) => setIncludeName(e.target.checked)} />
							<span className="form-check-label">{t('mailSignature.includeName')}</span>
						</label>
					</div>
					<div className={styles.previewBox}>
						<div className={styles.preview} dangerouslySetInnerHTML={{ __html: activeHtml }} />
					</div>
					<div className={styles.actions}>
						<Button variant="filled" color="primary" size="md" onClick={copySignature}>
							<Icon name="check_circle" size={18} /> {isEmailView ? t('mailSignature.copyEmail') : t('mailSignature.copySignature')}
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
				<textarea className={styles.htmlArea} readOnly rows={6} value={activeHtml} />
			</details>

			<SaveToast open={Boolean(toast)} message={toast} onClose={() => setToast('')} />
		</div>
	);
}
