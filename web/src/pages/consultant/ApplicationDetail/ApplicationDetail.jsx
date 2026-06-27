import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, generatePath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import { submitApplication, upsertEvidence, getUploadUrl, updateApplication, downloadEvidence, previewEvidence, deleteEvidence } from '../../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import { validateEvidenceFile, EVIDENCE_ACCEPT_STRING } from '../../../services/storage';
import Stepper from '../../../components/Stepper/Stepper';
import SaveToast from '../../../components/SaveToast/SaveToast';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import styles from './ApplicationDetail.module.css';

// Consultant page to upload evidence, accept terms, and submit a badge application
export default function ApplicationDetail({ application, onReload }) {
	// Initialize translation utility
	const { t } = useTranslation();
	// Programmatic navigation between application pages
	const navigate = useNavigate();

	// Derive badge, requirements, existing evidence and GUID from the application
	const badge = application?.badge;
	const requirements = badge?.badge_requirements || [];
	const evidencesRaw = application?.requirements_evidences || [];
	const appGuid = application?.application_guid;

	// Map requirement IDs to their uploaded evidence objects
	const [evidenceMap, setEvidenceMap] = useState({});
	// Store the consultant's optional notes text
	const [notes, setNotes] = useState(application?.consultant_notes || application?.consultantNotes || '');
	// Track which requirements are currently uploading a file
	const [uploading, setUploading] = useState({});
	// Track which requirement accordion panels are expanded
	const [expandedReqs, setExpandedReqs] = useState({});
	// Track whether the user has accepted the terms checkbox
	const [termsAccepted, setTermsAccepted] = useState(false);
	// Track whether the application is currently being submitted
	const [submitting, setSubmitting] = useState(false);
	// Store a global submission error message
	const [error, setError] = useState(null);
	// Store per-requirement file upload error messages
	const [uploadErrors, setUploadErrors] = useState({});
	// Control visibility of the auto-save toast notification
	const [showSaveToast, setShowSaveToast] = useState(false);
	// Track whether notes are currently being auto-saved
	const [savingNotes, setSavingNotes] = useState(false);
	// Keep a ref to the last saved notes value to detect unsaved changes
	const notesRef = useRef(application?.consultant_notes || application?.consultantNotes || '');
	// Hold refs to each requirement's file input element for programmatic reset
	const fileInputRefs = useRef({});

	// Build the evidence map and expand all requirement panels on mount
	useEffect(() => {
		const map = {};
		const expanded = {};
		evidencesRaw.forEach((ev) => {
			const reqId = ev.requirement_id || ev.requirementId;
			map[reqId] = ev;
		});
		requirements.forEach((req) => {
			const reqId = req.requirement_id || req.requirementId;
			expanded[reqId] = true;
		});
		setEvidenceMap(map);
		setExpandedReqs(expanded);
	}, []);

	// Check whether a given requirement already has an evidence upload
	function hasEvidence(reqId) {
		return !!evidenceMap[reqId];
	}

	// Count how many requirements already have uploaded evidence
	const completedCount = requirements.filter((req) => {
		const reqId = req.requirement_id || req.requirementId;
		return hasEvidence(reqId);
	}).length;

	// Whether every requirement has evidence, and whether the form can be submitted
	const allEvidencesUploaded = requirements.length > 0 && completedCount === requirements.length;
	const canSubmit = allEvidencesUploaded && termsAccepted;

	// Map an upload error code to a user-facing translated message
	function getUploadErrorMessage(err) {
		const code = err.code;
		if (code === 'EVIDENCE_FILE_MISSING') return t('applicationDetail.errors.noFile');
		if (code === 'EVIDENCE_FILE_INVALID_FORMAT') return t('applicationDetail.errors.invalidFormat');
		if (code === 'EVIDENCE_FILE_TOO_LARGE') return t('applicationDetail.errors.fileTooLarge');
		if (code === 'SUPABASE_UPLOAD_FAILED') return t('applicationDetail.errors.uploadFailed');
		if (code === 'SUPABASE_CONFIG_MISSING') return t('applicationDetail.errors.uploadFailed');
		return t('applicationDetail.errors.uploadFailed');
	}

	// Validate, upload to storage, and record evidence for a given requirement
	async function handleFileUpload(requirementId, file) {
		if (!file) return;

		setUploading((prev) => ({ ...prev, [requirementId]: true }));
		setUploadErrors((prev) => ({ ...prev, [requirementId]: null }));
		try {
			validateEvidenceFile(file);

			// Some files (e.g. .zip) report an empty MIME type — fall back to the
			// extension so the server-side content-type gate gets a valid value.
			const EXT_MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', zip: 'application/zip' };
			const ext = file.name.split('.').pop().toLowerCase();
			const contentType = file.type || EXT_MIME[ext] || 'application/octet-stream';

			const { uploadUrl, finalFileUrl } = await getUploadUrl(appGuid, requirementId, file.name, contentType, file.size);

			const uploadRes = await fetch(uploadUrl, {
				method: 'PUT',
				headers: { 'Content-Type': file.type || 'application/octet-stream' },
				body: file,
			});
			if (!uploadRes.ok) {
				const err = new Error('Upload to storage failed.');
				err.code = 'SUPABASE_UPLOAD_FAILED';
				throw err;
			}

			const evidence = await upsertEvidence(appGuid, {
				requirementId,
				evidenceFileUrl: finalFileUrl,
				evidenceFileType: file.type || null,
			});
			setEvidenceMap((prev) => ({ ...prev, [requirementId]: evidence }));
			setShowSaveToast(true);
		} catch (err) {
			setUploadErrors((prev) => ({ ...prev, [requirementId]: getUploadErrorMessage(err) }));
		} finally {
			setUploading((prev) => ({ ...prev, [requirementId]: false }));
			if (fileInputRefs.current[requirementId]) {
				fileInputRefs.current[requirementId].value = '';
			}
		}
	}

	// Submit the application and navigate to the confirmation page
	async function handleSubmit() {
		setSubmitting(true);
		setError(null);
		try {
			const result = await submitApplication(appGuid, notes || null);
			navigate(
				generatePath(SHARED.APPLICATION_SUBMITTED, { id: appGuid }),
				{
					state: {
						applicationGuid: appGuid,
						badgeTitle: title,
						submittedAt: result?.submittedAt || new Date().toISOString(),
					},
				}
			);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setSubmitting(false);
		}
	}

	// Auto-save the consultant notes to the API when the textarea loses focus
	async function handleNotesSave() {
		if (notes === notesRef.current || savingNotes) return;
		setSavingNotes(true);
		try {
			await updateApplication(appGuid, { consultantNotes: notes || null });
			notesRef.current = notes;
			setShowSaveToast(true);
		} catch {
			// silent — notes will still be sent on submit
		} finally {
			setSavingNotes(false);
		}
	}

	async function handlePreviewEvidence(evidenceId) {
		try {
			const { previewUrl } = await previewEvidence(appGuid, evidenceId);
			window.open(previewUrl, '_blank');
		} catch {
			setError(t('applicationDetail.errors.downloadFailed'));
		}
	}

	async function handleDownloadEvidence(evidenceId) {
		try {
			const { downloadUrl } = await downloadEvidence(appGuid, evidenceId);
			window.open(downloadUrl, '_blank');
		} catch {
			setError(t('applicationDetail.errors.downloadFailed'));
		}
	}

	// Remove an uploaded evidence file (allowed while the application is Open).
	async function handleRemoveEvidence(requirementId, evidenceId) {
		setUploadErrors((prev) => ({ ...prev, [requirementId]: null }));
		try {
			await deleteEvidence(appGuid, evidenceId);
			setEvidenceMap((prev) => {
				const next = { ...prev };
				delete next[requirementId];
				return next;
			});
			setShowSaveToast(true);
		} catch (err) {
			setUploadErrors((prev) => ({ ...prev, [requirementId]: resolveErrorMessage(err) }));
		}
	}

	// Derive display fields from the badge (handles snake_case/camelCase shapes)
	const title = badge?.badge_title || badge?.badgeTitle || '';
	const description = badge?.badge_description || badge?.badgeDescription;
	const points = badge?.badge_points || badge?.badgePoints;
	const imgUrl = badge?.badge_img_url || badge?.badgeImgUrl;
	const areaName = badge?.area?.area_name;
	const expirationDays = badge?.expiration_duration_days ?? badge?.expirationDurationDays;
	const stageTitle = badge?.progression_stage?.stage_title || badge?.progressionStage?.stageTitle;
	const stageCode = badge?.progression_stage?.stage_code || badge?.progressionStage?.stageCode;

	// Determine the active stepper step based on progress
	const activeStep = canSubmit ? 3 : allEvidencesUploaded ? 2 : 1;

	// Localized labels for the submission stepper
	const steps = [
		{ label: t('applicationDetail.stepSelectBadge') },
		{ label: t('applicationDetail.stepUploadEvidence') },
		{ label: t('applicationDetail.stepTerms') },
		{ label: t('applicationDetail.stepSubmit') },
	];

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav className={styles.breadcrumb} aria-label={t('shared.breadcrumb')}>
				<Link to={SHARED.APPLICATIONS} className={styles.breadcrumbLink}>
					{t('applicationDetail.applications')}
				</Link>
				<span className={styles.breadcrumbSeparator}>
					<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				</span>
				<span className={styles.breadcrumbActive}>{title}</span>
			</nav>

			<h1 className={styles.pageTitle}>
				{t('applicationDetail.submitApplication')}: {title}
			</h1>

			{error && <div className={styles.errorBanner}>{error}</div>}

			<div className={styles.content}>
				{/* Stepper */}
				<div className={styles.card}>
					<p className={styles.cardLabel}>{t('applicationDetail.applicationState')}</p>
					<Stepper steps={steps} activeStep={activeStep} />
				</div>

				{/* Badge Info */}
				<div className={styles.badgeCard}>
					<div className={styles.badgeIcon}>
						{imgUrl ? (
							<img src={imgUrl} alt={title} className={styles.badgeIconImg} />
						) : application?.application_state === 'Accepted' ? (
							// Gold trophy only once the badge is actually earned (Accepted);
							// for Open/Submitted/etc. show a neutral badge icon so it doesn't
							// look obtained.
							<Icon name="trophy" size={42} color="var(--color-badge-premium)" />
						) : (
							<Icon name="badge" size={42} color="var(--color-secondary)" />
						)}
					</div>
					<div className={styles.badgeBody}>
						<h2 className={styles.badgeName}>Badge {title}</h2>
						<div className={styles.chipRow}>
							{points != null && (
								<span className={`${styles.chip} ${styles.chipGreen}`}>
									<Icon name="star-points" size={16} />
									+ {points} {t('badgeDetail.pointsLabel')}
								</span>
							)}
							{(stageTitle || stageCode) && (
								<span className={`${styles.chip} ${styles.chipBlue}`}>
									<Icon name="evolution" size={16} />
									{stageTitle || stageCode}
								</span>
							)}
							{areaName && (
								<span className={`${styles.chip} ${styles.chipPurple}`}>
									<Icon name="area" size={16} />
									{areaName}
								</span>
							)}
							{expirationDays && (
								<span className={`${styles.chip} ${styles.chipOrange}`}>
									<Icon name="clock" size={16} />
									{expirationDays} {t('badgeDetail.validDays')}
								</span>
							)}
						</div>
						{description && <p className={styles.badgeDescription}>{description}</p>}
					</div>
				</div>

				{/* Requirements & Evidence - Full Width */}
				<div className={styles.requirementsCard}>
					<div className={styles.requirementsHeader}>
						<h2 className={styles.sectionTitle}>
							{t('applicationDetail.requirementsAndEvidences')}
						</h2>
						<span className={styles.progressLabel}>
							{completedCount}/{requirements.length} {t('applicationDetail.completed')}
						</span>
					</div>

					{requirements.length > 0 && (
						<div className={styles.progressTrack}>
							<div
								className={styles.progressFill}
								style={{ width: `${requirements.length > 0 ? Math.round((completedCount / requirements.length) * 100) : 0}%` }}
							/>
						</div>
					)}

					<div className={styles.requirementsList}>
						{requirements.length === 0 ? (
							<p className={styles.noRequirements}>{t('applicationDetail.noRequirements')}</p>
						) : (
							requirements.map((req, idx) => {
								const reqId = req.requirement_id || req.requirementId || idx;
								const reqTitle = req.requirement_title || req.requirementTitle || t('applicationDetail.requirementN', { n: idx + 1 });
								const reqDesc = req.requirement_description || req.requirementDescription || '';
								const evidence = evidenceMap[reqId];
								const isOpen = !!expandedReqs[reqId];
								const isUploading = !!uploading[reqId];
								const reqError = uploadErrors[reqId];

								return (
									<div key={reqId} className={`${styles.reqItem} ${evidence ? styles.reqItemComplete : ''}`}>
										<div
											className={styles.reqHeader}
											onClick={() => setExpandedReqs((p) => ({ ...p, [reqId]: !p[reqId] }))}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => e.key === 'Enter' && setExpandedReqs((p) => ({ ...p, [reqId]: !p[reqId] }))}
											aria-expanded={isOpen}
										>
											<div className={`${styles.reqIconCircle} ${evidence ? styles.reqIconComplete : ''}`}>
												{evidence ? (
													<Icon name="check" size={16} color="#fff" />
												) : (
													<Icon name="certificate" size={16} color="var(--color-outline)" />
												)}
											</div>
											<div className={styles.reqBody}>
												<h4 className={styles.reqTitle}>{reqTitle}</h4>
												<p className={styles.reqDescription}>{reqDesc}</p>
											</div>
											<div className={`${styles.reqChevron} ${isOpen ? styles.reqChevronOpen : ''}`}>
												<Icon name="keyboard_arrow_down" size={16} color="var(--color-outline)" />
											</div>
										</div>

										{isOpen && (
											<div className={styles.reqContent}>
												{evidence && (
													<div className={styles.evidenceFile}>
														<div className={styles.evidenceFileIcon}>
															<Icon name="paper" size={16} color="var(--color-secondary)" />
														</div>
														<div className={styles.evidenceFileInfo}>
															<p className={styles.evidenceFileName}>
																{decodeURIComponent(
																	(evidence.evidence_file_url || evidence.evidenceFileUrl || '').split('/').pop() || 'file'
																)}
															</p>
															<span className={styles.evidenceStatus}>
																<Icon name="check_circle" size={14} color="var(--color-green-on-soft)" />
																{t('applicationDetail.submitted')}
															</span>
														</div>
														<Tooltip text={t('applicationDetail.viewEvidence')}>
															<button
																type="button"
																className={styles.evidenceDownloadBtn}
																onClick={() => handlePreviewEvidence(evidence.evidence_id || evidence.evidenceId)}
																aria-label={t('applicationDetail.viewEvidence')}
															>
																<Icon name="eye" size={16} color="var(--color-secondary)" />
															</button>
														</Tooltip>
														<Tooltip text={t('applicationDetail.downloadEvidence')}>
															<button
																type="button"
																className={styles.evidenceDownloadBtn}
																onClick={() => handleDownloadEvidence(evidence.evidence_id || evidence.evidenceId)}
																aria-label={t('applicationDetail.downloadEvidence')}
															>
																<Icon name="download" size={16} color="var(--color-secondary)" />
															</button>
														</Tooltip>
														<Tooltip text={t('applicationDetail.removeEvidence')}>
															<button
																type="button"
																className={styles.evidenceRemoveBtn}
																onClick={() => handleRemoveEvidence(reqId, evidence.evidence_id || evidence.evidenceId)}
																aria-label={t('applicationDetail.removeEvidence')}
															>
																<Icon name="trash" size={16} color="var(--color-error)" />
															</button>
														</Tooltip>
													</div>
												)}

												<div className={styles.reqUploadSection}>
													<p className={styles.reqUploadLabel}>
														{evidence
															? t('applicationDetail.replaceEvidence')
															: t('applicationDetail.addEvidence')
														}
													</p>

													<label className={styles.reqFileLabel}>
														<input
															type="file"
															accept={EVIDENCE_ACCEPT_STRING}
															className={styles.reqFileInput}
															ref={(el) => { fileInputRefs.current[reqId] = el; }}
															onChange={(e) => handleFileUpload(reqId, e.target.files[0])}
															disabled={isUploading}
														/>
														<span className={styles.reqFileLabelBtn}>
															<Icon name="download" size={16} color="var(--color-secondary)" />
															{t('applicationDetail.chooseFile')}
														</span>
														<span className={styles.reqFileLabelHint}>
															{t('applicationDetail.allowedFormats')}
														</span>
													</label>
												</div>

												{isUploading && (
													<div className={styles.uploadingIndicator}>
														<div className={styles.spinner} />
														{t('applicationDetail.uploading')}
													</div>
												)}

												{reqError && (
													<p className={styles.reqError}>{reqError}</p>
												)}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Notes */}
				<div className={styles.notesCard}>
					<h2 className={styles.notesTitle}>
						{t('applicationDetail.additionalNotes')}
					</h2>
					<textarea
						className={styles.notesTextarea}
						placeholder={t('applicationDetail.notesPlaceholder')}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						onBlur={handleNotesSave}
					/>
				</div>

				{/* Terms - only shown when all evidences uploaded */}
				{allEvidencesUploaded && (
					<div className={styles.termsCard}>
						<div className={styles.checkboxRow}>
							<input
								type="checkbox"
								id="terms"
								className={styles.checkbox}
								checked={termsAccepted}
								onChange={(e) => setTermsAccepted(e.target.checked)}
							/>
							<label htmlFor="terms" className={styles.checkboxLabel}>
								{t('applicationDetail.acceptTermsPrefix')}
								<a href={SHARED.POLICIES} target="_blank" rel="noopener noreferrer">{t('applicationDetail.termsLink')}</a>
								{t('applicationDetail.acceptTermsMiddle')}
								<a href={SHARED.POLICIES} target="_blank" rel="noopener noreferrer">{t('applicationDetail.privacyLink')}</a>
								{t('applicationDetail.acceptTermsSuffix')}
							</label>
						</div>
						<p className={styles.disclaimer}>{t('applicationDetail.disclaimer')}</p>
					</div>
				)}

				{/* Actions */}
				<div className={styles.actions}>
					<button type="button" className={styles.cancelBtn} onClick={() => navigate(SHARED.APPLICATIONS)}>
						{t('applicationDetail.cancel')}
					</button>
					<button
						type="button"
						className={styles.submitBtn}
						disabled={!canSubmit || submitting}
						onClick={handleSubmit}
					>
						<Icon name="send" size={16} color="#fff" />
						{submitting
							? t('applicationDetail.submitting')
							: t('applicationDetail.submitApplication')
						}
					</button>
				</div>
			</div>

			<SaveToast
				open={showSaveToast}
				message={t('applicationDetail.changesSaved')}
				onClose={() => setShowSaveToast(false)}
			/>
		</div>
	);
}
