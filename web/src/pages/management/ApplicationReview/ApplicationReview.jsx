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
import Tooltip from '../../../components/Tooltip/Tooltip';
import FormAlert from '../../../components/FormAlert/FormAlert';
import SaveToast from '../../../components/SaveToast/SaveToast';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import styles from './ApplicationReview.module.css';

function evidenceForRequirement(evidences, reqId) {
	return evidences.find((ev) => String(ev.requirement_id) === String(reqId));
}

export default function ApplicationReview({ application, onReload }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useUser();

	const isSll = user?.role === 'Service Line Leader';
	// SLL is the final gatekeeper (accept/reject); TM forwards to the SLL.
	const reviewField = isSll ? 'sll_reviewed' : 'tm_reviewed';
	const validationsPath = isSll ? SLL.VALIDATIONS : TM.VALIDATIONS;
	const validationsLabel = isSll ? t('sidebar.sll.validations') : t('sidebar.tm.validations');
	const primary = isSll
		? { action: 'accept', labelKey: 'applicationReview.acceptApplication', icon: 'check', confirmKey: 'applicationReview.confirmAccept', toastKey: 'applicationReview.toast.accepted' }
		: { action: 'review', labelKey: 'applicationReview.forward', icon: 'send', confirmKey: 'applicationReview.confirmForward', toastKey: 'applicationReview.toast.forwarded' };

	const appGuid = application?.application_guid;
	const badge = application?.badge || {};
	const [evidences, setEvidences] = useState(application?.requirements_evidences || []);
	const requirements = badge.badge_requirements || [];
	const consultantNotes = application?.consultant_notes || '';
	const consultantName = application?.user?.user?.full_name || '—';
	const consultantImg = application?.user?.user?.profile_img_url;

	const title = badge.badge_title || `Badge #${application?.badge_id}`;
	const imgUrl = badge.badge_img_url;
	const learningPathName = badge.learning_path?.path_title;
	const serviceLineName = badge.service_line?.service_line_name;
	const areaName = badge.area?.area_name;
	const stageTitle = badge.progression_stage?.stage_title;
	const stageCode = badge.progression_stage?.stage_code?.stage_code;
	const points = badge.badge_points;

	// Per-evidence review state
	const [evidenceNotes, setEvidenceNotes] = useState({});
	const [evidenceBusy, setEvidenceBusy] = useState(null); // `${evidenceId}:${approved}`

	// Final decision state
	const [reviewerNotes, setReviewerNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null); // primary.action | 'reject'
	const [error, setError] = useState(null);
	const [toast, setToast] = useState('');

	const reviewedCount = useMemo(
		() => evidences.filter((ev) => ev[reviewField] != null).length,
		[evidences, reviewField]
	);

	async function handleDownload(evidenceId) {
		try {
			const { downloadUrl } = await downloadEvidence(appGuid, evidenceId);
			if (downloadUrl) window.open(downloadUrl, '_blank');
		} catch (err) {
			setError(resolveErrorMessage(err));
		}
	}

	async function handleReviewEvidence(evidenceId, approved) {
		setError(null);
		setEvidenceBusy(`${evidenceId}:${approved}`);
		try {
			await reviewEvidence(appGuid, evidenceId, approved, evidenceNotes[evidenceId] || null);
			setEvidences((prev) =>
				prev.map((ev) => (ev.evidence_id === evidenceId ? { ...ev, [reviewField]: approved } : ev))
			);
			setToast(t(approved ? 'applicationReview.toast.evidenceApproved' : 'applicationReview.toast.evidenceRejected'));
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setEvidenceBusy(null);
		}
	}

	async function handleDecision(action) {
		setConfirmAction(null);
		setError(null);
		setSubmitting(true);
		try {
			await validateApplication(appGuid, action, reviewerNotes.trim() || null);
			setToast(t(action === 'reject' ? 'applicationReview.toast.rejected' : primary.toastKey));
			onReload?.();
			navigate(validationsPath);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setSubmitting(false);
		}
	}

	function renderEvidenceStatus(reviewed) {
		if (reviewed == null) {
			return <span className={`${styles.statusChip} ${styles.statusPending}`}>{t('applicationReview.status.pending')}</span>;
		}
		if (reviewed) {
			return <span className={`${styles.statusChip} ${styles.statusApproved}`}>{t('applicationReview.status.approved')}</span>;
		}
		return <span className={`${styles.statusChip} ${styles.statusRejected}`}>{t('applicationReview.status.rejected')}</span>;
	}

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav className={styles.breadcrumb} aria-label={t('shared.breadcrumb', { defaultValue: 'Breadcrumb' })}>
				<Link to={validationsPath} className={styles.breadcrumbLink}>
					{validationsLabel}
				</Link>
				<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				<span className={styles.breadcrumbActive}>{title}</span>
			</nav>

			<h1 className={styles.pageTitle}>{t('applicationReview.title')}</h1>

			<div className={styles.layout}>
				{/* Main column */}
				<div className={styles.mainColumn}>
					{/* Header card */}
					<div className={styles.card}>
						<div className={styles.badgeHeader}>
							<div className={styles.badgeIcon}>
								{imgUrl ? (
									<img src={imgUrl} alt={title} className={styles.badgeImg} />
								) : (
									<Icon name="badge" size={28} color="var(--color-secondary)" />
								)}
							</div>
							<div className={styles.badgeHeaderInfo}>
								<h2 className={styles.badgeTitle}>{title}</h2>
								<div className={styles.consultantRow}>
									<Avatar src={consultantImg} name={consultantName} size={26} />
									<span className={styles.consultantName}>{consultantName}</span>
								</div>
							</div>
						</div>

						<div className={styles.infoGrid}>
							{learningPathName && (
								<div className={styles.infoRow}>
									<Icon name="learning-path" size={16} color="var(--color-outline)" />
									<span className={styles.infoLabel}>Learning Path</span>
									<span className={styles.infoValue}>{learningPathName}</span>
								</div>
							)}
							{serviceLineName && (
								<div className={styles.infoRow}>
									<Icon name="service-line" size={16} color="var(--color-outline)" />
									<span className={styles.infoLabel}>Service Line</span>
									<span className={styles.infoValue}>{serviceLineName}</span>
								</div>
							)}
							{areaName && (
								<div className={styles.infoRow}>
									<Icon name="area" size={16} color="var(--color-outline)" />
									<span className={styles.infoLabel}>{t('shared.area')}</span>
									<span className={styles.infoValue}>{areaName}</span>
								</div>
							)}
							{(stageTitle || stageCode) && (
								<div className={styles.infoRow}>
									<Icon name="badge" size={16} color="var(--color-outline)" />
									<span className={styles.infoLabel}>{t('badgeDetail.level', { defaultValue: 'Level' })}</span>
									<span className={styles.infoValue}>{stageCode ? `${stageCode} — ${stageTitle}` : stageTitle}</span>
								</div>
							)}
							{points != null && (
								<div className={styles.infoRow}>
									<Icon name="star-points" size={16} color="var(--color-outline)" />
									<span className={styles.infoLabel}>{t('shared.points')}</span>
									<span className={styles.infoValue}>{points} pts</span>
								</div>
							)}
						</div>

						{consultantNotes && (
							<div className={styles.notesBlock}>
								<span className={styles.notesLabel}>{t('applicationReview.consultantNotes')}</span>
								<p className={styles.notesText}>{consultantNotes}</p>
							</div>
						)}
					</div>

					{/* Requirements & evidences */}
					<div className={styles.card}>
						<div className={styles.sectionHeader}>
							<h2 className={styles.sectionTitle}>{t('applicationReview.evidencesTitle')}</h2>
							<span className={styles.reviewedCounter}>
								{t('applicationReview.reviewedCount', { reviewed: reviewedCount, total: evidences.length })}
							</span>
						</div>

						{requirements.length === 0 ? (
							<p className={styles.emptyText}>{t('applicationReview.noRequirements')}</p>
						) : (
							<ul className={styles.reqList}>
								{requirements.map((req, idx) => {
									const reqId = req.requirement_id || idx;
									const reqTitle = req.requirement_title || `Requirement ${idx + 1}`;
									const evidence = evidenceForRequirement(evidences, reqId);
									const evId = evidence?.evidence_id;
									const evUrl = evidence?.evidence_file_url || '';
									const evFileName = evUrl ? decodeURIComponent(evUrl.split('/').pop()) : '';

									return (
										<li key={reqId} className={styles.reqRow}>
											<div className={styles.reqTop}>
												<div className={styles.reqInfo}>
													<span className={styles.reqName}>{reqTitle}</span>
													{evidence ? (
														<div className={styles.evidenceFile}>
															<Icon name="paper" size={14} color="var(--color-secondary)" />
															<span className={styles.evidenceFileName}>{evFileName}</span>
															<Tooltip text={t('applicationDetail.downloadEvidence')}>
																<button
																	type="button"
																	className={styles.downloadBtn}
																	onClick={() => handleDownload(evId)}
																	aria-label={t('applicationDetail.downloadEvidence')}
																>
																	<Icon name="download" size={14} color="var(--color-secondary)" />
																</button>
															</Tooltip>
														</div>
													) : (
														<span className={styles.noEvidence}>{t('applicationReview.noEvidence')}</span>
													)}
												</div>
												{evidence && renderEvidenceStatus(evidence[reviewField])}
											</div>

											{evidence && (
												<div className={styles.reqActions}>
													<input
														type="text"
														className={styles.evidenceNoteInput}
														placeholder={t('applicationReview.evidenceNotePlaceholder')}
														value={evidenceNotes[evId] || ''}
														maxLength={1000}
														onChange={(e) =>
															setEvidenceNotes((prev) => ({ ...prev, [evId]: e.target.value }))
														}
													/>
													<div className={styles.evidenceBtns}>
														<Button
															variant="outlined"
															color="success"
															size="sm"
															loading={evidenceBusy === `${evId}:true`}
															disabled={Boolean(evidenceBusy)}
															onClick={() => handleReviewEvidence(evId, true)}
														>
															<Icon name="check" size={14} /> {t('applicationReview.approve')}
														</Button>
														<Button
															variant="outlined"
															color="danger"
															size="sm"
															loading={evidenceBusy === `${evId}:false`}
															disabled={Boolean(evidenceBusy)}
															onClick={() => handleReviewEvidence(evId, false)}
														>
															<Icon name="close" size={14} /> {t('applicationReview.reject')}
														</Button>
													</div>
												</div>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>

				{/* Decision sidebar */}
				<aside className={styles.decisionCard}>
					<h2 className={styles.sectionTitle}>{t('applicationReview.decisionTitle')}</h2>
					<p className={styles.decisionHint}>{t(isSll ? 'applicationReview.decisionHintSll' : 'applicationReview.decisionHint')}</p>

					<label className={styles.decisionLabel} htmlFor="reviewerNotes">
						{t('applicationReview.reviewerNotes')}
					</label>
					<textarea
						id="reviewerNotes"
						className={styles.decisionTextarea}
						rows={4}
						maxLength={1000}
						placeholder={t('applicationReview.reviewerNotesPlaceholder')}
						value={reviewerNotes}
						onChange={(e) => setReviewerNotes(e.target.value)}
					/>

					<FormAlert message={error} variant="danger" className="mt-2" />

					<div className={styles.decisionButtons}>
						<Button
							variant="filled"
							color={isSll ? 'success' : 'primary'}
							fullWidth
							loading={submitting}
							onClick={() => setConfirmAction(primary.action)}
						>
							<Icon name={primary.icon} size={16} /> {t(primary.labelKey)}
						</Button>
						<Button
							variant="outlined"
							color="danger"
							fullWidth
							disabled={submitting}
							onClick={() => setConfirmAction('reject')}
						>
							<Icon name="close" size={16} /> {t('applicationReview.rejectApplication')}
						</Button>
					</div>

					<Link to={SHARED.APPLICATIONS} className={styles.backLink}>
						{t('applicationReview.backToList')}
					</Link>
				</aside>
			</div>

			<ConfirmToast
				open={confirmAction != null}
				message={
					confirmAction === 'reject'
						? t('applicationReview.confirmReject')
						: t(primary.confirmKey)
				}
				confirmLabel={t('shared.yes', { defaultValue: 'Yes' })}
				cancelLabel={t('shared.no', { defaultValue: 'No' })}
				onConfirm={() => handleDecision(confirmAction)}
				onCancel={() => setConfirmAction(null)}
			/>

			<SaveToast open={Boolean(toast)} message={toast} onClose={() => setToast('')} />
		</div>
	);
}
