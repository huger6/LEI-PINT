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

function verifyUrl(link) {
	return `${window.location.origin}/verify/${link}`;
}

function buildSignatureHtml(name, badges) {
	const items = badges
		.filter((b) => b.verificationLink && b.badge?.imageUrl)
		.map((b) =>
			`<a href="${verifyUrl(b.verificationLink)}" target="_blank" rel="noopener" style="text-decoration:none;margin-right:8px;display:inline-block;">` +
			`<img src="${b.badge.imageUrl}" alt="${b.badge.title || 'Badge'}" height="56" width="56" style="border:0;border-radius:8px;vertical-align:middle;" />` +
			`</a>`
		)
		.join('');

	return (
		`<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">` +
		`<tr><td style="font-size:15px;font-weight:bold;padding-bottom:2px;">${name}</td></tr>` +
		`<tr><td style="font-size:12px;color:#6b7280;padding-bottom:8px;">Softinsa</td></tr>` +
		`<tr><td>${items}</td></tr>` +
		`</table>`
	);
}

export default function MailSignature() {
	const { t } = useTranslation();
	const { user, displayName } = useUser();
	// Only consultants earn badges; other roles (TM/SLL) get a clean empty state
	// instead of the earned-badges 403.
	const isConsultant = user?.role === 'Consultant';

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
				// Only consultants earn badges; other roles get a clean empty state.
				if (!isConsultant) {
					if (active) setBadges([]);
					return;
				}
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
		() => badges.filter((b) => selected.has(b.awardedBadgeId)),
		[badges, selected]
	);

	const signatureHtml = useMemo(
		() => buildSignatureHtml(displayName || '', selectedBadges),
		[displayName, selectedBadges]
	);

	function toggle(id) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function copyHtml() {
		try {
			await navigator.clipboard.writeText(signatureHtml);
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

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('mailSignature.title')}</h1>
			<p className={styles.subtitle}>{t('mailSignature.subtitle')}</p>

			<FormAlert message={error} variant="danger" />

			{usableBadges.length === 0 ? (
				<ContentCard className={styles.emptyCard}>
					<Icon name="email" size={28} color="var(--color-outline)" />
					<p className={styles.emptyText}>{t('mailSignature.empty')}</p>
				</ContentCard>
			) : (
				<div className={styles.grid}>
					{/* Badge selection */}
					<ContentCard className={styles.card}>
						<CardHeader icon="badge" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('mailSignature.selectBadges')} />
						<ul className={styles.badgeList}>
							{usableBadges.map((b) => {
								const checked = selected.has(b.awardedBadgeId);
								return (
									<li key={b.awardedBadgeId}>
										<label className={`${styles.badgeRow} ${checked ? styles.badgeRowActive : ''}`}>
											<input
												type="checkbox"
												className="form-check-input"
												checked={checked}
												onChange={() => toggle(b.awardedBadgeId)}
											/>
											<img src={b.badge.imageUrl} alt={b.badge.title} className={styles.badgeThumb} />
											<span className={styles.badgeName}>{b.badge.title}</span>
										</label>
									</li>
								);
							})}
						</ul>
					</ContentCard>

					{/* Preview + copy */}
					<ContentCard className={styles.card}>
						<CardHeader icon="email" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('mailSignature.preview')} />
						<div
							className={styles.preview}
							dangerouslySetInnerHTML={{ __html: signatureHtml }}
						/>
						<div className={styles.actions}>
							<Button variant="filled" color="primary" size="sm" onClick={copyHtml} disabled={selectedBadges.length === 0}>
								<Icon name="link" size={16} /> {t('mailSignature.copyHtml')}
							</Button>
						</div>
						<details className={styles.htmlDetails}>
							<summary className={styles.htmlSummary}>{t('mailSignature.showHtml')}</summary>
							<textarea className={styles.htmlArea} readOnly rows={6} value={signatureHtml} />
						</details>
					</ContentCard>
				</div>
			)}

			<SaveToast open={Boolean(toast)} message={toast} onClose={() => setToast('')} />
		</div>
	);
}
