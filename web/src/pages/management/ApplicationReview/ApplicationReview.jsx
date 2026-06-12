import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, TM, SLL } from '../../../routes/paths';
import {
	downloadEvidence,
	reviewEvidence,
	validateApplication,
} from '../../../features/applications/api/applicationsApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Button from '../../../components/Button/Button';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import FormAlert from '../../../components/FormAlert/FormAlert';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
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

function evidenceForRequirement(evidences, reqId) {
	return evidences.find((ev) => String(ev.requirement_id) === String(reqId));
}

export default function ApplicationReview({ application }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';
	// The verification that matters is the Talent Manager's: the TM marks each
	// evidence correct; the SLL sees it read-only ("Verificado pelo TM") and decides.
	const reviewField = 'tm_reviewed';
	const validationsPath = isSll ? SLL.VALIDATIONS : TM.VALIDATIONS;

	const appGuid = application?.application_guid;
	const state = application?.application_state;
	const badge = application?.badge || {};
	const requirements = badge.badge_requirements || [];
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

	// SLL-only: process history + the Talent Manager's prior opinion (from audit logs)
	const logs = application?.application_validation_logs || [];
	const tmLog = logs.find((l) => (l.validator_function || l.validatorFunction) === 'Talent Manager');
	const tmName = tmLog?.user?.full_name || tmLog?.user?.fullName || '';
	const tmComment = tmLog?.validations_comments || tmLog?.validationsComments || '';
	const tmDate = tmLog?.validated_at || tmLog?.validatedAt || null;
	const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

	const [reviewerNotes, setReviewerNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [evidenceBusy, setEvidenceBusy] = useState(null);
	const [error, setError] = useState(null);
	const [result, setResult] = useState(null); // post-decision result screen

	const RESULT_META = {
		accept: { icon: 'check_circle', cls: styles.resOk },
		review: { icon: 'send', cls: styles.resOk },
		send_back: { icon: 'chevron_backward', cls: styles.resWarn },
		reject: { icon: 'close_circle', cls: styles.resBad },
	};

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

	const ACTION_CONFIRM = { review: 'applicationReview.confirmForward', accept: 'applicationReview.confirmAccept', reject: 'applicationReview.confirmReject', send_back: 'applicationReview.confirmSendBack' };
	const NEEDS_NOTE = ['send_back', 'reject'];

	async function handleDownload(evidenceId) {
		try {
			const { downloadUrl } = await downloadEvidence(appGuid, evidenceId);
			if (downloadUrl) window.open(downloadUrl, '_blank');
		} catch (err) {
			setError(resolveErrorMessage(err));
		}
	}

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

	function requestDecision(action) {
		setError(null);
		if (NEEDS_NOTE.includes(action) && !reviewerNotes.trim()) {
			setError(t('applicationReview.commentRequired'));
			return;
		}
		setConfirmAction(action);
	}

	async function handleDecision(action) {
		setConfirmAction(null);
		setSubmitting(true);
		try {
			await validateApplication(appGuid, action, reviewerNotes.trim() || null);
			setResult(action);
			setSubmitting(false);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setSubmitting(false);
		}
	}

	// Post-decision result screen.
	if (result) {
		const meta = RESULT_META[result];
		return (
			<div className={styles.page}>
				<div className={styles.resultWrap}>
					<div className={`${styles.card} ${styles.resultCard}`}>
						<div className={`${styles.resultIcon} ${meta.cls}`}>
							<Icon name={meta.icon} size={34} color="#fff" />
						</div>
						<h1 className={styles.resultTitle}>{t(`applicationReview.result.${result}.title`)}</h1>
						<p className={styles.resultDesc}>{t(`applicationReview.result.${result}.desc`)}</p>
						<div className={styles.resultBox}>{t('applicationReview.result.box', { consultant: consultantName, badge: title })}</div>
						<Button variant="filled" color="primary" onClick={() => navigate(validationsPath)}>
							{t('applicationReview.result.back')}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
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

					{/* SLL: process history + TM prior opinion */}
					{isSll && (
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
									<span className={styles.histDate}>{fmtDate(tmDate)}</span>
									<span className={styles.histDesc}>{t('applicationReview.histTmBy', { name: tmName || '—' })}</span>
								</div>
								<div className={styles.histStep}>
									<div className={`${styles.histIcon} ${tmLog ? styles.histDone : ''}`}><Icon name="paper" size={16} color={tmLog ? '#fff' : 'var(--color-outline)'} /></div>
									<span className={styles.histLabel}>{t('applicationReview.histOpinion')}</span>
									<span className={styles.histDate}>{fmtDate(tmDate)}</span>
									<span className={styles.histDesc}>{t('applicationReview.histOpinionPositive')}</span>
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
											<strong>{t('applicationReview.histOpinionPositive')}</strong>
											<p>“{tmComment}”</p>
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
							<span className={styles.validatedPill}>{t(isSll ? 'applicationReview.verifiedCount' : 'applicationReview.validatedCount', { done: validatedCount, total: totalReqs })}</span>
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
												<span className={styles.reqTitle}>{r.code}: {r.title}</span>
												{isSll && r.validated ? (
													<span className={`${styles.evPill} ${styles.evVerified}`}>
														<Icon name="check_circle" size={12} color="var(--color-green-on-soft)" /> {t('applicationReview.verifiedByTm')}
													</span>
												) : r.evidence ? (
													<span className={`${styles.evPill} ${styles.evSubmitted}`}>{t('applicationReview.evidenceSubmitted')}</span>
												) : (
													<span className={`${styles.evPill} ${styles.evMissing}`}>{t('applicationReview.noEvidence')}</span>
												)}
											</div>
											{r.description && <p className={styles.reqDesc}>{r.description}</p>}
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
											{!isSll && (
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
											)}
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

						<Link to={SHARED.APPLICATIONS} className={styles.backLink}>{t('applicationReview.backToList')}</Link>
					</div>
				</aside>
			</div>

			<ConfirmToast
				open={confirmAction != null}
				message={confirmAction ? t(ACTION_CONFIRM[confirmAction]) : ''}
				confirmLabel={t('shared.yes', { defaultValue: 'Sim' })}
				cancelLabel={t('shared.no', { defaultValue: 'Não' })}
				onConfirm={() => handleDecision(confirmAction)}
				onCancel={() => setConfirmAction(null)}
			/>
		</div>
	);
}
