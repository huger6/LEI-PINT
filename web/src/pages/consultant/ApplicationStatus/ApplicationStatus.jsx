import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import { downloadEvidence, previewEvidence, generateCertificate } from '../../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import { downloadFromUrl } from '../../../utils/download';
import Stepper from '../../../components/Stepper/Stepper';
import ApplicationTimeline from '../../../components/ApplicationTimeline/ApplicationTimeline';
import Icon from '../../../components/Icons/Icons';
import Tooltip from '../../../components/Tooltip/Tooltip';
import Button from '../../../components/Button/Button';
import FormAlert from '../../../components/FormAlert/FormAlert';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './ApplicationStatus.module.css';

const CERT_LANG_MAP = { pt: 'pt', en: 'en', es: 'es' };

const WORKFLOW_STEPS = [
	{ label: 'Open', key: 'Open' },
	{ label: 'Submitted', key: 'Submitted' },
	{ label: 'In Validation', key: 'In validation' },
	{ label: 'Closed', key: 'Closed' },
];

// Map an application state string to its corresponding stepper index
function getActiveStep(state) {
	if (state === 'Open') return 0;
	if (state === 'Submitted') return 1;
	if (state === 'In validation') return 2;
	return 3;
}

// Consultant page showing an application's workflow status, badge info, timeline, feedback, and requirements
export default function ApplicationStatus({ application, badge }) {
	// Initialize translation and language utilities
	const { t, i18n } = useTranslation();
	// Control whether the badge info accordion is expanded
	const [badgeInfoOpen, setBadgeInfoOpen] = useState(true);
	// Track whether a certificate download is in progress
	const [certLoading, setCertLoading] = useState(false);
	// Store any certificate download error message
	const [certError, setCertError] = useState(null);

	const state = application?.application_state || application?.state;
	const appGuid = application?.application_guid || application?.applicationGuid;
	const logs = application?.application_validation_logs || [];
	const evidences = application?.requirements_evidences || application?.requirementsEvidences || [];
	const consultantNotes = application?.consultant_notes || application?.consultantNotes || '';
	const requirements = badge?.badge_requirements || badge?.badgeRequirements || [];

	const title = badge?.badge_title || badge?.badgeTitle || `Badge #${application?.badge_id}`;
	const description = badge?.badge_description || badge?.badgeDescription;
	const badgeSlug = badge?.badge_slug || badge?.badgeSlug;
	const points = badge?.badge_points || badge?.badgePoints;
	const imgUrl = badge?.badge_img_url || badge?.badgeImgUrl;
	const badgeType = badge?.badge_type || badge?.badgeType;
	const areaName = badge?.area?.area_name;
	const areaSlug = badge?.area?.area_slug;
	const stageTitle = badge?.progression_stage?.stage_title || badge?.progressionStage?.stageTitle;
	const stageCode = badge?.progression_stage?.stage_code?.stage_code || badge?.progressionStage?.stageCode?.stageCode;
	const serviceLineName = badge?.service_line?.service_line_name || badge?.serviceLine?.serviceLineName;
	const serviceLineSlug = badge?.service_line?.sl_slug;
	const learningPathName = badge?.learning_path?.path_title || badge?.learningPath?.pathTitle;
	const learningPathSlug = badge?.learning_path?.path_slug;
	const expirationDays = badge?.expiration_duration_days ?? badge?.expirationDurationDays;

	const activeStep = getActiveStep(state);

	const SYSTEM_FUNCTIONS = ['trg_log_application_state_change', 'System'];
	const userLogs = logs.filter((l) => !SYSTEM_FUNCTIONS.includes(l.validator_function || l.validatorFunction));
	const sortedLogs = [...userLogs].sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

	// Format a date string into a localized date and time string
	function formatDateTime(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
			+ ' às '
			+ d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
	}

	// Find the uploaded evidence record matching a given requirement ID
	function getEvidenceForRequirement(reqId) {
		return evidences.find(
			(ev) => String(ev.requirement_id || ev.requirementId) === String(reqId)
		);
	}

	async function handlePreviewEvidence(evidenceId) {
		try {
			const { previewUrl } = await previewEvidence(appGuid, evidenceId);
			window.open(previewUrl, '_blank');
		} catch {
			// silent
		}
	}

	async function handleDownloadEvidence(evidenceId) {
		try {
			const { downloadUrl } = await downloadEvidence(appGuid, evidenceId);
			window.open(downloadUrl, '_blank');
		} catch {
			// silent
		}
	}

	// Generate and download (never preview) a completion certificate for this application
	async function handleDownloadCertificate() {
		setCertError(null);
		setCertLoading(true);
		try {
			const lang = CERT_LANG_MAP[(i18n.language || 'pt').slice(0, 2)] || 'pt';
			const { certificateUrl } = await generateCertificate(appGuid, lang);
			if (certificateUrl) {
				await downloadFromUrl(certificateUrl, `certificado-${title || 'badge'}.pdf`);
			} else {
				setCertError(t('applicationStatus.certificateUnavailable', { defaultValue: 'Certificate unavailable.' }));
			}
		} catch (err) {
			setCertError(resolveErrorMessage(err));
		} finally {
			setCertLoading(false);
		}
	}

	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<nav className={styles.breadcrumb} aria-label={t('shared.breadcrumb')}>
				<Link to={SHARED.APPLICATIONS} className={styles.breadcrumbLink}>
					{t('applicationDetail.applications')}
				</Link>
				<span className={styles.breadcrumbSep}>
					<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				</span>
				<span className={styles.breadcrumbActive}>{title}</span>
			</nav>

			<h1 className={styles.pageTitle}>
				{t('applicationStatus.stateTitle', { defaultValue: 'Application Status' })}: {title}
			</h1>

			<div className={styles.content}>
				{/* Stepper */}
				<div className={styles.card}>
					<p className={styles.cardLabel}>
						{t('applicationStatus.applicationState', { defaultValue: 'Application State' })}
					</p>
					<Stepper steps={WORKFLOW_STEPS} activeStep={activeStep} />

					{state === 'Accepted' && (
						<div className={styles.certificateRow}>
							<Button
								variant="filled"
								color="primary"
								size="sm"
								loading={certLoading}
								onClick={handleDownloadCertificate}
							>
								<Icon name="download" size={16} /> {t('applicationStatus.downloadCertificate', { defaultValue: 'Download certificate' })}
							</Button>
							<FormAlert message={certError} variant="danger" className="mt-2" />
						</div>
					)}
				</div>

				{/* Two Column: Badge Info + Timeline */}
				<div className={styles.twoColumn}>
					{/* Left: Badge Info */}
					<div className={styles.badgeInfoCard}>
						<div
							className={styles.badgeInfoHeader}
							onClick={() => setBadgeInfoOpen((v) => !v)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => e.key === 'Enter' && setBadgeInfoOpen((v) => !v)}
						>
							<h2 className={styles.sectionTitle}>
								{t('applicationStatus.badgeInfo', { defaultValue: 'Badge Information' })}
							</h2>
							<div className={`${styles.chevron} ${badgeInfoOpen ? styles.chevronOpen : ''}`}>
								<Icon name="keyboard_arrow_down" size={20} color="var(--color-outline)" />
							</div>
						</div>

						{badgeInfoOpen && (
							<div className={styles.badgeInfoBody}>
								<div className={styles.badgePreview}>
									{imgUrl && (
										badgeSlug
											? <Link to={SHARED.BADGE_DETAIL.replace(':slug', badgeSlug)}><img src={imgUrl} alt={title} className={styles.badgePreviewImg} /></Link>
											: <img src={imgUrl} alt={title} className={styles.badgePreviewImg} />
									)}
									{badgeSlug
										? <Link className={styles.badgePreviewNameLink} to={SHARED.BADGE_DETAIL.replace(':slug', badgeSlug)}><h3 className={styles.badgePreviewName}>{title}</h3></Link>
										: <h3 className={styles.badgePreviewName}>{title}</h3>}
									{description && (
										badgeSlug
											? <Link className={styles.badgePreviewDescLink} to={SHARED.BADGE_DETAIL.replace(':slug', badgeSlug)}><p className={styles.badgePreviewDesc}><TranslatedText text={description} /></p></Link>
											: <p className={styles.badgePreviewDesc}><TranslatedText text={description} /></p>
									)}
								</div>

								<div className={styles.infoGrid}>
									{learningPathName && (
										<div className={styles.infoRow}>
											<Icon name="evolution" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>Learning Path</span>
											{learningPathSlug
												? <Link className={styles.infoValueLink} to={SHARED.STRUCTURE_LP_DETAIL.replace(':slug', learningPathSlug)}>{learningPathName}</Link>
												: <span className={styles.infoValue}>{learningPathName}</span>}
										</div>
									)}
									{serviceLineName && (
										<div className={styles.infoRow}>
											<Icon name="service-line" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>Service Line</span>
											{serviceLineSlug
												? <Link className={styles.infoValueLink} to={SHARED.STRUCTURE_SL_DETAIL.replace(':slug', serviceLineSlug)}>{serviceLineName}</Link>
												: <span className={styles.infoValue}>{serviceLineName}</span>}
										</div>
									)}
									{areaName && (
										<div className={styles.infoRow}>
											<Icon name="area" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>{t('shared.area')}</span>
											{areaSlug
												? <Link className={styles.infoValueLink} to={SHARED.STRUCTURE_AREA_DETAIL.replace(':slug', areaSlug)}>{areaName}</Link>
												: <span className={styles.infoValue}>{areaName}</span>}
										</div>
									)}
									{(stageTitle || stageCode) && (
										<div className={styles.infoRow}>
											<Icon name="badge" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>{t('badgeDetail.level', { defaultValue: 'Level' })}</span>
											{areaSlug && stageCode
												? <Link className={styles.infoValueLink} to={SHARED.STRUCTURE_LEVEL_DETAIL.replace(':areaSlug', areaSlug).replace(':stageCode', stageCode)}>
													{stageCode ? `${stageCode} — ${stageTitle}` : stageTitle}
												</Link>
												: <span className={styles.infoValue}>
													{stageCode ? `${stageCode} — ${stageTitle}` : stageTitle}
												</span>}
										</div>
									)}
									{badgeType && (
										<div className={styles.infoRow}>
											<Icon name="badge" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>{t('shared.type', { defaultValue: 'Type' })}</span>
											<span className={styles.infoValue}>{badgeType}</span>
										</div>
									)}
									{points != null && (
										<div className={styles.infoRow}>
											<Icon name="star-points" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>{t('shared.points')}</span>
											<span className={styles.infoValue}>{points} pts</span>
										</div>
									)}
									{expirationDays && (
										<div className={styles.infoRow}>
											<Icon name="clock" size={18} color="var(--color-outline)" />
											<span className={styles.infoLabel}>{t('applicationStatus.expiration', { defaultValue: 'Expiration' })}</span>
											<span className={styles.infoValue}>{expirationDays} {t('badgeDetail.validDays')}</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Right: Timeline + Feedback + Evidences + Requirements */}
					<div className={styles.rightColumn}>
						{/* Validation Timeline */}
						<ApplicationTimeline logs={logs} openedAt={application?.opened_at} />

						{/* Consultant Notes */}
						{consultantNotes && (
							<div>
								<h2 className={styles.sectionTitle}>
									{t('applicationDetail.additionalNotes')}
								</h2>
								<div className={styles.feedbackItem}>
									<p className={styles.feedbackText}><TranslatedText text={consultantNotes} /></p>
								</div>
							</div>
						)}

						{/* Reviewer Feedback */}
						{sortedLogs.some((l) => l.validations_comments || l.validationsComments) && (
							<div>
								<h2 className={styles.sectionTitle}>
									{t('applicationStatus.feedback', { defaultValue: 'Notes & Feedback' })}
								</h2>
								<div className={styles.feedbackList}>
									{sortedLogs.filter((l) => l.validations_comments || l.validationsComments).map((log, idx) => {
										const role = log.validator_function || log.validatorFunction || '';
										const userName = log.user?.full_name || log.user?.fullName || '';
										const comment = log.validations_comments || log.validationsComments;
										const date = log.created_at || log.createdAt;

										return (
											<div key={idx} className={styles.feedbackItem}>
												<div className={styles.feedbackHeader}>
													<span className={styles.feedbackUser}>{userName}</span>
													<span className={styles.feedbackRole}>{role}</span>
													{date && <span className={styles.feedbackDate}>{formatDateTime(date)}</span>}
												</div>
												<p className={styles.feedbackText}><TranslatedText text={comment} /></p>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Requirements & Evidence */}
						{requirements.length > 0 && (
							<div>
								<h2 className={styles.sectionTitle}>
									{t('applicationDetail.requirementsAndEvidences')}
								</h2>
								<div className={styles.reqList}>
									{requirements.map((req, idx) => {
										const reqId = req.requirement_id || req.requirementId || idx;
										const reqTitle = req.requirement_title || req.requirementTitle || `Requirement ${idx + 1}`;
										const evidence = getEvidenceForRequirement(reqId);
										const evUrl = evidence?.evidence_file_url || evidence?.evidenceFileUrl || '';
										const evFileName = evUrl ? decodeURIComponent(evUrl.split('/').pop()) : '';
										const evId = evidence?.evidence_id || evidence?.evidenceId;

										return (
											<div key={reqId} className={styles.reqRow}>
												<span className={styles.reqCode}>
													{req.requirement_code || `A${idx + 1}`}
												</span>
												<div className={styles.reqContent}>
													<span className={styles.reqName}><TranslatedText text={reqTitle} /></span>
													{evidence ? (
														<div className={styles.reqEvidenceFile}>
															<Icon name="paper" size={14} color="var(--color-secondary)" />
															<span className={styles.reqEvidenceFileName}>{evFileName}</span>
															<Tooltip text={t('applicationDetail.viewEvidence')}>
																<button
																	type="button"
																	className={styles.evidenceDownloadBtn}
																	onClick={() => handlePreviewEvidence(evId)}
																	aria-label={t('applicationDetail.viewEvidence')}
																>
																	<Icon name="eye" size={14} color="var(--color-secondary)" />
																</button>
															</Tooltip>
															<Tooltip text={t('applicationDetail.downloadEvidence')}>
																<button
																	type="button"
																	className={styles.evidenceDownloadBtn}
																	onClick={() => handleDownloadEvidence(evId)}
																	aria-label={t('applicationDetail.downloadEvidence')}
																>
																	<Icon name="download" size={14} color="var(--color-secondary)" />
																</button>
															</Tooltip>
														</div>
													) : (
														<span className={styles.reqNoEvidence}>
															{t('applicationStatus.noEvidence', { defaultValue: 'No evidence uploaded' })}
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
