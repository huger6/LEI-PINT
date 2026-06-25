import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, TM, SLL, ADMIN } from '../../../routes/paths';
import {
	downloadEvidence,
	reviewEvidence,
	validateApplication,
	generateCertificate,
} from '../../../features/applications/api/applicationsApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Button from '../../../components/Button/Button';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import Spinner from '../../../components/Spinner/Spinner';
import FormAlert from '../../../components/FormAlert/FormAlert';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './ApplicationReview.module.css';

const APP_STATE_KEY = {
	'Open': 'open', 'Submitted': 'submitted', 'In validation': 'inValidation',
	'Accepted': 'accepted', 'Rejected': 'rejected',
};

// Circular percentage ring (validated evidence %).
function PercentRing({ pct }) {
	const r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
	return (
		<svg width="68" height="68" viewBox="0 0 68 68" className={styles.ring}>
			<circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-outline-variant)" strokeWidth="5" />
			<circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-secondary)" strokeWidth="5"
				strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 34 34)" />
			<text x="34" y="39" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-on-surface)">{pct}%</text>
		</svg>
	);
}

// Find the evidence record that matches a given requirement ID.
function evidenceForRequirement(evidences, reqId) {
	return evidences.find((ev) => String(ev.requirement_id) === String(reqId));
}

const CERT_LANG_MAP = { pt: 'pt', en: 'en', es: 'es' };

export default function ApplicationReview({ application }) {
	// Access translation and language helpers.
	const { t, i18n } = useTranslation();
	// Allow programmatic navigation after a decision.
	const navigate = useNavigate();
	// Retrieve the current authenticated user.
	const { user } = useUser();
	const isAdmin = user?.role === 'Administrator';

	const appGuid = application?.application_guid;
	const state = application?.application_state;

	// The Administrator is a super-reviewer: which review behaviour applies is
	// driven by the application's current state (Submitted → Talent Manager step,
	// In validation → Service Line Leader step) rather than a fixed role.
	const isSll = isAdmin
		? state === 'In validation'
		: user?.role === 'Service Line Leader';
	// The verification that matters is the Talent Manager's: the TM marks each
	// evidence correct; the SLL sees it read-only ("Verificado pelo TM") and decides.
	// Each reviewer validates independently: TM marks tm_reviewed, SLL marks sll_reviewed.
	const reviewField = isSll ? 'sll_reviewed' : 'tm_reviewed';
	const validationsPath = isAdmin ? ADMIN.APPLICATIONS : (isSll ? SLL.VALIDATIONS : TM.VALIDATIONS);
	const badge = application?.badge || {};
	const requirements = badge.badge_requirements || [];
	// Store the live list of evidence records, updated on toggle.
	const [evidences, setEvidences] = useState(application?.requirements_evidences || []);

	const consultantName = application?.user?.user?.full_name || '—';
	const consultantImg = application?.user?.user?.profile_img_url;
	const serviceLineName = badge.service_line?.service_line_name;
	const areaName = badge.area?.area_name;
	const learningPathName = badge.learning_path?.path_title;
	const title = badge.badge_title || `Badge #${application?.badge_id}`;
	const imgUrl = badge.badge_img_url;
	const expirationDays = badge.expiration_duration_days ?? badge.expirationDurationDays;
	const submittedAt = application?.submitted_at || application?.opened_at;
	const consultantPoints = application?.consultant_total_points;
	const consultantRank = application?.consultant_ranking_position;

	// Process history + the Talent Manager's prior opinion (from audit logs).
	const logs = application?.application_validation_logs || [];
	const tmLog = logs.find((l) => (l.validator_function || l.validatorFunction) === 'Talent Manager');
	const tmName = tmLog?.user?.full_name || tmLog?.user?.fullName || '';
	const tmComment = tmLog?.validations_comments || tmLog?.validationsComments || '';
	const tmDate = tmLog?.validated_at || tmLog?.validatedAt || null;
	const tmAction = tmLog?.validator_action || tmLog?.validatorAction || '';
	// Real parecer derived from the TM's logged action (forward = positive, else returned).
	const tmPositive = /in validation/i.test(tmAction);
	const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

	// Store the reviewer's feedback notes text.
	const [reviewerNotes, setReviewerNotes] = useState('');
	// Track whether the decision submission is in progress.
	const [submitting, setSubmitting] = useState(false);
	// Hold the pending action awaiting confirmation ('accept', 'reject', etc.).
	const [confirmAction, setConfirmAction] = useState(null);
	// Track which evidence item is currently being toggled.
	const [evidenceBusy, setEvidenceBusy] = useState(null);
	// Store an error message to display in the form alert.
	const [error, setError] = useState(null);
	// Store the action key of the completed decision for the result screen.
	const [result, setResult] = useState(null); // post-decision result screen
	// Store the reviewer note shown on the post-decision result screen.
	const [resultNote, setResultNote] = useState(''); // reviewer reason shown on result
	// Track whether the certificate download is in progress.
	const [certLoading, setCertLoading] = useState(false);
	// Store a certificate download error message.
	const [certError, setCertError] = useState(null);

	const RESULT_META = {
		accept: { icon: 'check_circle', cls: styles.resOk, tone: styles.toneOk },
		review: { icon: 'send', cls: styles.resOk, tone: styles.toneOk },
		send_back: { icon: 'chevron_backward', cls: styles.resWarn, tone: styles.toneWarn },
		reject: { icon: 'close_circle', cls: styles.resBad, tone: styles.toneBad },
	};

	// Inline confirmation panel styling per action (replaces the plain toast).
	const CONFIRM_META = {
		review: { cls: styles.confirmOk, icon: 'send', iconColor: 'var(--color-green-on-soft)', yesColor: 'success' },
		accept: { cls: styles.confirmOk, icon: 'check_circle', iconColor: 'var(--color-green-on-soft)', yesColor: 'success' },
		send_back: { cls: styles.confirmWarn, icon: 'chevron_backward', iconColor: 'var(--color-orange-on-soft)', yesColor: 'primary' },
		reject: { cls: styles.confirmBad, icon: 'close_circle', iconColor: 'var(--color-red-on-soft)', yesColor: 'danger' },
	};

	// Build enriched row objects for each requirement with its evidence and validation state.
	const reqRows = useMemo(() => requirements.map((req, idx) => {
		const reqId = req.requirement_id || idx;
		const ev = evidenceForRequirement(evidences, reqId);
		return {
			reqId,
			code: req.requirement_code || `A${idx + 1}`,
			title: req.requirement_title || `Requisito ${idx + 1}`,
			description: req.requirement_description || '',
			evidence: ev,
			validated: ev ? ev[reviewField] === true : false,
		};
	}), [requirements, evidences, reviewField]);

	const totalReqs = reqRows.length;
	const uploadedCount = reqRows.filter((r) => r.evidence).length;
	const validatedCount = reqRows.filter((r) => r.validated).length;
	const pct = totalReqs ? Math.round((validatedCount / totalReqs) * 100) : 0;
	const allValidated = totalReqs > 0 && validatedCount === totalReqs;

	// Decision actions per role.
	const decisionButtons = isSll
		? [
			{ action: 'accept', labelKey: 'applicationReview.approvePublish', icon: 'check', variant: 'filled', color: 'success', disabled: !allValidated },
			{ action: 'reject', labelKey: 'applicationReview.rejectApplication', icon: 'close', variant: 'outlined', color: 'danger' },
			{ action: 'send_back', labelKey: 'applicationReview.returnConsultant', icon: 'chevron_backward', variant: 'outlined', color: 'primary' },
		]
		: [
			{ action: 'review', labelKey: 'applicationReview.approveForward', icon: 'send', variant: 'filled', color: 'success', disabled: !allValidated },
			{ action: 'send_back', labelKey: 'applicationReview.requestRectification', icon: 'chevron_backward', variant: 'outlined', color: 'primary' },
		];

	const NEEDS_NOTE = ['send_back', 'reject'];

	// Download the evidence file for the given evidence ID.
	async function handleDownload(evidenceId) {
		try {
			const { downloadUrl } = await downloadEvidence(appGuid, evidenceId);
			if (downloadUrl) window.open(downloadUrl, '_blank');
		} catch (err) {
			setError(resolveErrorMessage(err));
		}
	}

	// Toggle the validated state of a single evidence item.
	async function toggleEvidence(evId, currentlyValidated) {
		setError(null);
		setEvidenceBusy(evId);
		try {
			const next = !currentlyValidated;
			await reviewEvidence(appGuid, evId, next, null);
			setEvidences((prev) => prev.map((ev) => (ev.evidence_id === evId ? { ...ev, [reviewField]: next } : ev)));
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setEvidenceBusy(null);
		}
	}

	// Validate the reviewer's notes requirement and open the confirmation panel.
	function requestDecision(action) {
		setError(null);
		if (NEEDS_NOTE.includes(action) && !reviewerNotes.trim()) {
			setError(t('applicationReview.commentRequired'));
			return;
		}
		setConfirmAction(action);
	}

	// Submit the reviewer's decision to the API and show the result screen.
	async function handleDecision(action) {
		setConfirmAction(null);
		setSubmitting(true);
		try {
			await validateApplication(appGuid, action, reviewerNotes.trim() || null);
			setResultNote(reviewerNotes.trim());
			setResult(action);
			setSubmitting(false);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setSubmitting(false);
		}
	}

	// Download the certificate PDF for the accepted application.
	async function handleDownloadCertificate() {
		setCertError(null);
		setCertLoading(true);
		try {
			const lang = CERT_LANG_MAP[(i18n.language || 'pt').slice(0, 2)] || 'pt';
			const { certificateUrl } = await generateCertificate(appGuid, lang);
			if (certificateUrl) window.open(certificateUrl, '_blank');
		} catch (err) {
			setCertError(resolveErrorMessage(err));
		} finally {
			setCertLoading(false);
		}
	}

	// Post-decision result screen.
	if (result) {
		const meta = RESULT_META[result];
		const showReason = (result === 'reject' || result === 'send_back') && resultNote;
		return (
			<div className={styles.page}>
				<div className={styles.resultWrap}>
					<div className={`${styles.resultCard} ${meta.tone}`}>
						<div className={`${styles.resultIcon} ${meta.cls}`}>
							<Icon name={meta.icon} size={36} color="#fff" />
						</div>
						<h1 className={styles.resultTitle}>{t(`applicationReview.result.${result}.title`)}</h1>
						<p className={styles.resultDesc}>{t(`applicationReview.result.${result}.desc`)}</p>
						<div className={styles.resultBox}>
							<div className={styles.resultBadge}>
								<Avatar src={consultantImg} name={consultantName} size={32} />
								<div>
									<span className={styles.resultConsultant}>{consultantName}</span>
									<span className={styles.resultBadgeTitle}>{title}</span>
								</div>
							</div>
							{showReason && (
								<div className={styles.resultReason}>
									<span className={styles.resultReasonLabel}>{t('applicationReview.result.reasonLabel')}</span>
									<p className={styles.resultReasonText}>"{resultNote}"</p>
								</div>
							)}
							<p className={styles.resultNotified}>
								<Icon name="email" size={14} color="var(--color-outline)" /> {t('applicationReview.result.notified')}
							</p>
						</div>
						{result === 'accept' && (
							<FormAlert message={certError} variant="danger" className="mt-2 mb-0" />
						)}
						<div className={styles.resultActions}>
							{result === 'accept' && (
								<Button variant="outlined" color="primary" loading={certLoading} onClick={handleDownloadCertificate}>
									<Icon name="download" size={16} /> {t('applicationReview.result.downloadCertificate')}
								</Button>
							)}
							<Button variant="filled" color="primary" onClick={() => navigate(validationsPath)}>
								{t('applicationReview.result.back')}
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			{submitting && (
				<div className={styles.submitOverlay} role="status" aria-live="polite">
					<Spinner />
				</div>
			)}
			<nav className={styles.breadcrumb} aria-label="breadcrumb">
				<Link to={validationsPath} className={styles.breadcrumbLink}>{t('applicationReview.title')}</Link>
				<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				<span className={styles.breadcrumbActive}>{title}</span>
			</nav>

			<h1 className={styles.pageTitle}>{t('applicationReview.title')}</h1>

			<div className={styles.layout}>
				<div className={styles.mainColumn}>
					{/* Consultant header */}
					<div className={styles.card}>
						<div className={styles.consultantRow}>
							<Avatar src={consultantImg} name={consultantName} size={48} />
							<div className={styles.consultantInfo}>
								<h2 className={styles.consultantName}>{consultantName}</h2>
								<span className={styles.consultantMeta}>
									{[serviceLineName, areaName].filter(Boolean).join(' · ') || '—'}
								</span>
							</div>
							{isSll && (consultantPoints != null || consultantRank != null) && (
								<div className={styles.consultantStats}>
									{consultantPoints != null && (
										<div className={styles.statChip}>
											<Icon name="star-points" size={16} color="var(--color-primary)" />
											<div className={styles.statChipBody}>
												<span className={styles.statChipLabel}>{t('applicationReview.totalPoints')}</span>
												<span className={styles.statChipValue}>{consultantPoints.toLocaleString('pt-PT')}</span>
											</div>
										</div>
									)}
									{consultantRank != null && (
										<div className={styles.statChip}>
											<Icon name="ranking" size={16} color="var(--color-secondary)" />
											<div className={styles.statChipBody}>
												<span className={styles.statChipLabel}>{t('applicationReview.ranking')}</span>
												<span className={styles.statChipValue}>#{consultantRank}</span>
											</div>
										</div>
									)}
								</div>
							)}
							<div className={styles.consultantSide}>
								<span className={styles.statePill}>
									<span className={styles.stateDot} />
									{t('applicationReview.stateLabel')}: {t(`applicationReview.appState.${APP_STATE_KEY[state] || 'submitted'}`, { defaultValue: state })}
								</span>
								{submittedAt && (
									<span className={styles.dateMeta}>
										<Icon name="clock" size={14} color="var(--color-outline)" />
										{new Date(submittedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Process history (req 21) — shown to TM and SLL. The TM prior-opinion
					    box only renders once a TM log exists, so it stays hidden while the
					    TM is still reviewing a Submitted application. */}
					{(
						<div className={styles.card}>
							<h3 className={styles.sectionTitle}>{t('applicationReview.histTitle')}</h3>
							<div className={styles.history}>
								<div className={styles.histStep}>
									<div className={`${styles.histIcon} ${styles.histDone}`}><Icon name="send" size={16} color="#fff" /></div>
									<span className={styles.histLabel}>{t('applicationReview.histSubmission')}</span>
									<span className={styles.histDate}>{fmtDate(submittedAt)}</span>
									<span className={styles.histDesc}>{t('applicationReview.histSubmissionDesc')}</span>
								</div>
								<div className={styles.histStep}>
									<div className={`${styles.histIcon} ${tmLog ? styles.histDone : ''}`}><Icon name="check" size={16} color={tmLog ? '#fff' : 'var(--color-outline)'} /></div>
									<span className={styles.histLabel}>{t('applicationReview.histTmValidation')}</span>
									<span className={styles.histDate}>{tmLog ? fmtDate(tmDate) : t('applicationReview.histPending')}</span>
									<span className={styles.histDesc}>{tmLog ? t('applicationReview.histTmBy', { name: tmName || '—' }) : t('applicationReview.histPending')}</span>
								</div>
								<div className={styles.histStep}>
									<div className={`${styles.histIcon} ${tmLog ? styles.histDone : ''}`}><Icon name="paper" size={16} color={tmLog ? '#fff' : 'var(--color-outline)'} /></div>
									<span className={styles.histLabel}>{t('applicationReview.histOpinion')}</span>
									<span className={styles.histDate}>{tmLog ? fmtDate(tmDate) : t('applicationReview.histPending')}</span>
									<span className={styles.histDesc}>{tmLog ? t(tmPositive ? 'applicationReview.opinionPositive' : 'applicationReview.opinionReturned') : t('applicationReview.histPending')}</span>
								</div>
								<div className={styles.histStep}>
									<div className={`${styles.histIcon} ${state === 'Accepted' ? styles.histDone : ''}`}><Icon name="badge" size={16} color={state === 'Accepted' ? '#fff' : 'var(--color-outline)'} /></div>
									<span className={styles.histLabel}>{t('applicationReview.histFinal')}</span>
									<span className={styles.histDate}>{state === 'Accepted' ? t('applicationReview.appState.accepted') : t('applicationReview.histPending')}</span>
									<span className={styles.histDesc}>{t('applicationReview.histFinalDesc')}</span>
								</div>
							</div>

							{tmLog && (
								<div className={styles.opinionBox}>
									<div className={styles.opinionHead}>
										<Icon name="check_circle" size={16} color="var(--color-green-on-soft)" />
										<span>{t('applicationReview.opinionTitle', { name: tmName || 'Talent Manager' })}</span>
									</div>
									<span className={styles.opinionDate}>{t('applicationReview.opinionDone', { date: fmtDate(tmDate) })}</span>
									{tmComment && (
										<div className={styles.opinionQuote}>
											<strong>{t(tmPositive ? 'applicationReview.opinionPositive' : 'applicationReview.opinionReturned')}</strong>
											<p>"<TranslatedText text={tmComment} />"</p>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Badge + progress */}
					<div className={styles.card}>
						<div className={styles.badgeRow}>
							<div className={styles.badgeIcon}>
								{imgUrl ? <img src={imgUrl} alt={title} className={styles.badgeImg} /> : <Icon name="badge" size={28} color="var(--color-secondary)" />}
							</div>
							<div className={styles.badgeInfo}>
								<h3 className={styles.badgeTitle}>{title}</h3>
								{learningPathName && <span className={styles.badgeLp}>Learning Path: {learningPathName}</span>}
							</div>
							{expirationDays != null && (
								<span className={styles.expire}>
									<Icon name="clock" size={14} color="var(--color-orange-on-soft)" />
									{t('applicationReview.expiresInDays', { count: expirationDays })}
								</span>
							)}
						</div>

						<div className={styles.progressHead}>
							<span>{t('applicationReview.progressLabel')}</span>
							<span className={styles.progressCount}>{t('applicationReview.completed', { done: uploadedCount, total: totalReqs })}</span>
						</div>
						<div className={styles.progressTrack}>
							<div className={styles.progressFill} style={{ width: totalReqs ? `${(uploadedCount / totalReqs) * 100}%` : '0%' }} />
						</div>
						<div className={styles.chips}>
							{reqRows.map((r) => (
								<span key={r.reqId} className={`${styles.chip} ${r.evidence ? styles.chipDone : ''}`}>
									<Icon name={r.evidence ? 'check_circle' : 'circle'} size={13} color={r.evidence ? 'var(--color-green-on-soft)' : 'var(--color-outline)'} />
									{r.code}
								</span>
							))}
						</div>
					</div>

					{/* Requirements & evidences */}
					<div className={styles.card}>
						<div className={styles.sectionHead}>
							<h3 className={styles.sectionTitle}>{t('applicationReview.evidencesTitle')}</h3>
							<span className={styles.validatedPill}>{t('applicationReview.validatedCount', { done: validatedCount, total: totalReqs })}</span>
						</div>

						{totalReqs === 0 ? (
							<p className={styles.muted}>{t('applicationReview.noRequirements')}</p>
						) : reqRows.map((r) => {
							const evUrl = r.evidence?.evidence_file_url || '';
							const evName = evUrl ? decodeURIComponent(evUrl.split('/').pop()) : '';
							const evId = r.evidence?.evidence_id;
							return (
								<div key={r.reqId} className={styles.reqCard}>
									<div className={styles.reqTop}>
										<Icon name="requirement" size={18} color="var(--color-secondary)" />
										<div className={styles.reqBody}>
											<div className={styles.reqTitleRow}>
												<span className={styles.reqTitle}>{r.code}: <TranslatedText text={r.title} /></span>
												{r.validated ? (
													<span className={`${styles.evPill} ${styles.evVerified}`}>
														<Icon name="check_circle" size={12} color="var(--color-green-on-soft)" /> {t('applicationReview.validatedLabel')}
													</span>
												) : r.evidence ? (
													<span className={`${styles.evPill} ${styles.evSubmitted}`}>{t('applicationReview.evidenceSubmitted')}</span>
												) : (
													<span className={`${styles.evPill} ${styles.evMissing}`}>{t('applicationReview.noEvidence')}</span>
												)}
												{/* For the SLL, show the TM's prior verification as read-only context. */}
												{isSll && r.evidence?.tm_reviewed && (
													<span className={`${styles.evPill} ${styles.evSubmitted}`}>{t('applicationReview.verifiedByTm')}</span>
												)}
											</div>
											{r.description && <p className={styles.reqDesc}><TranslatedText text={r.description} /></p>}
										</div>
									</div>

									{r.evidence && (
										<>
											<div className={styles.evBox}>
												<Icon name="paper" size={16} color="var(--color-secondary)" />
												<div className={styles.evMeta}>
													<span className={styles.evName}>{evName}</span>
													<span className={styles.evType}>{t('applicationReview.evidenceFile', { defaultValue: 'Documento' })}</span>
												</div>
												<button type="button" className={styles.viewBtn} onClick={() => handleDownload(evId)}>
													<Icon name="eye" size={14} color="var(--color-secondary)" /> {t('applicationReview.viewDocument')}
												</button>
											</div>
											<div className={styles.reqActions}>
												<span className={styles.reqActionLabel}>{t('applicationReview.markHint')}</span>
												<Button
													variant={r.validated ? 'filled' : 'outlined'}
													color={r.validated ? 'success' : 'primary'}
													size="sm"
													loading={evidenceBusy === evId}
													onClick={() => toggleEvidence(evId, r.validated)}
												>
													<Icon name={r.validated ? 'check_circle' : 'circle'} size={14} /> {r.validated ? t('applicationReview.validatedLabel') : t('applicationReview.markCorrect')}
												</Button>
											</div>
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Sidebar */}
				<aside className={styles.sidebar}>
					{/* Validation summary */}
					<div className={styles.card}>
						<h3 className={styles.sectionTitle}>{t('applicationReview.summaryTitle')}</h3>
						<ul className={styles.summaryList}>
							{reqRows.map((r) => (
								<li key={r.reqId} className={styles.summaryRow}>
									<span className={styles.summaryCode}>{r.code}</span>
									<span className={`${styles.summaryState} ${r.validated ? styles.summaryDone : ''}`}>
										<Icon name={r.validated ? 'check_circle' : 'circle'} size={14} color={r.validated ? 'var(--color-green-on-soft)' : 'var(--color-outline)'} />
										{r.validated ? t(isSll ? 'applicationReview.summaryApproved' : 'applicationReview.validatedLabel') : t('applicationReview.pendingLabel')}
									</span>
								</li>
							))}
						</ul>
						<div className={styles.ringWrap}><PercentRing pct={pct} /></div>
					</div>

					{/* Decision panel */}
					<div className={styles.card}>
						<h3 className={styles.sectionTitle}>
							<Icon name="megaphone" size={16} color="var(--color-secondary)" /> {t(isSll ? 'applicationReview.strategicTitle' : 'applicationReview.decisionPanelTitle')}
						</h3>
						<label className={styles.feedbackLabel} htmlFor="reviewerNotes">
							{t('applicationReview.feedbackLabel')} <span className={styles.required}>{t('applicationReview.feedbackRequired')}</span>
						</label>
						<textarea
							id="reviewerNotes"
							className={styles.textarea}
							rows={4}
							maxLength={2000}
							placeholder={t('applicationReview.reviewerNotesPlaceholder')}
							value={reviewerNotes}
							onChange={(e) => setReviewerNotes(e.target.value)}
						/>

						<FormAlert message={error} variant="danger" className="mt-2 mb-0" />

						<div className={styles.decisionButtons}>
							{decisionButtons.map((b) => (
								<Button
									key={b.action}
									variant={b.variant}
									color={b.color}
									fullWidth
									loading={submitting && confirmAction === b.action}
									disabled={submitting || b.disabled}
									onClick={() => requestDecision(b.action)}
								>
									<Icon name={b.icon} size={16} /> {t(b.labelKey)}
								</Button>
							))}
						</div>
						{!allValidated && <p className={styles.approveHint}>{t('applicationReview.approveHint')}</p>}

						{/* Explicit, prominent confirmation panel (per action) instead of a toast. */}
						{confirmAction && (
							<div className={`${styles.confirmPanel} ${CONFIRM_META[confirmAction].cls}`}>
								<div className={styles.confirmHead}>
									<Icon name={CONFIRM_META[confirmAction].icon} size={18} color={CONFIRM_META[confirmAction].iconColor} />
									<span>{t(`applicationReview.confirm.${confirmAction}.title`)}</span>
								</div>
								<p className={styles.confirmText}>{t(`applicationReview.confirm.${confirmAction}.text`, { consultant: consultantName })}</p>
								<div className={styles.confirmActions}>
									<Button variant="outlined" color="primary" size="sm" disabled={submitting} onClick={() => setConfirmAction(null)}>
										{t('shared.cancel')}
									</Button>
									<Button variant="filled" color={CONFIRM_META[confirmAction].yesColor} size="sm" loading={submitting} onClick={() => handleDecision(confirmAction)}>
										<Icon name={CONFIRM_META[confirmAction].icon} size={16} /> {t(`applicationReview.confirm.${confirmAction}.yes`)}
									</Button>
								</div>
							</div>
						)}

						<Link to={isAdmin ? ADMIN.APPLICATIONS : SHARED.APPLICATIONS} className={styles.backLink}>{t('applicationReview.backToList')}</Link>
					</div>
				</aside>
			</div>
		</div>
	);
}
