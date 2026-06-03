import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import { submitApplication, upsertEvidence } from '../../../features/applications/api/applicationsApi';
import { uploadFileToTemp } from '../../../services/storage';
import Stepper from '../../../components/Stepper/Stepper';
import Icon from '../../../components/Icons/Icons';
import styles from './ApplicationDetail.module.css';

const STEPS = [
	{ label: 'Select Badge' },
	{ label: 'Upload Evidence' },
	{ label: 'Terms & Conditions' },
	{ label: 'Submit' },
];

export default function ApplicationDetail({ application, badge }) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const requirements = badge?.badge_requirements || badge?.badgeRequirements || [];
	const evidencesRaw = application?.requirements_evidences || application?.requirementsEvidences || [];

	const [evidenceUrls, setEvidenceUrls] = useState({});
	const [uploading, setUploading] = useState({});
	const [expandedReqs, setExpandedReqs] = useState({});
	const [notes, setNotes] = useState('');
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const appGuid = application?.application_guid || application?.applicationGuid;

	useEffect(() => {
		const urlMap = {};
		const expanded = {};
		evidencesRaw.forEach((ev) => {
			const reqId = ev.requirement_id || ev.requirementId;
			urlMap[reqId] = ev.evidence_file_url || ev.evidenceFileUrl || ev.url || '';
		});
		requirements.forEach((req, idx) => {
			const reqId = req.requirement_id || req.requirementId || idx;
			expanded[reqId] = true;
		});
		setEvidenceUrls(urlMap);
		setExpandedReqs(expanded);
	}, []);

	function getEvidenceForRequirement(reqId) {
		return evidencesRaw.find(
			(ev) => String(ev.requirement_id || ev.requirementId) === String(reqId)
		);
	}

	function handleUrlChange(requirementId, value) {
		setEvidenceUrls((prev) => ({ ...prev, [requirementId]: value }));
	}

	async function handleSaveEvidence(requirementId) {
		const url = evidenceUrls[requirementId];
		if (!url?.trim()) return;
		setUploading((prev) => ({ ...prev, [requirementId]: true }));
		try {
			await upsertEvidence(appGuid, { requirementId, evidenceFileUrl: url });
		} catch (err) {
			setError(err.message);
		} finally {
			setUploading((prev) => ({ ...prev, [requirementId]: false }));
		}
	}

	async function handleFileUpload(requirementId, file) {
		if (!file) return;
		setUploading((prev) => ({ ...prev, [requirementId]: true }));
		try {
			const { publicUrl } = await uploadFileToTemp(file);
			setEvidenceUrls((prev) => ({ ...prev, [requirementId]: publicUrl }));
			await upsertEvidence(appGuid, { requirementId, evidenceFileUrl: publicUrl });
		} catch (err) {
			setError(err.message);
		} finally {
			setUploading((prev) => ({ ...prev, [requirementId]: false }));
		}
	}

	async function handleSubmit() {
		setSubmitting(true);
		try {
			await submitApplication(appGuid);
			navigate(SHARED.APPLICATIONS);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}

	const title = badge?.badge_title || badge?.badgeTitle || `Badge #${application?.badge_id || application?.badgeId}`;
	const description = badge?.badge_description || badge?.badgeDescription;
	const points = badge?.badge_points || badge?.badgePoints;
	const imgUrl = badge?.badge_img_url || badge?.badgeImgUrl;
	const areaName = badge?.area?.area_name;
	const expirationDays = badge?.expiration_duration_days ?? badge?.expirationDurationDays;
	const stageTitle = badge?.progression_stage?.stage_title || badge?.progressionStage?.stageTitle;
	const stageCode = badge?.progression_stage?.stage_code || badge?.progressionStage?.stageCode;

	const completedCount = requirements.filter((req) => {
		const reqId = req.requirement_id || req.requirementId;
		return !!getEvidenceForRequirement(reqId);
	}).length;

	const activeStep = termsAccepted ? 3 : completedCount === requirements.length && requirements.length > 0 ? 2 : 1;

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

			{error && (
				<div className={styles.errorBanner}>{error}</div>
			)}

			<div className={styles.content}>
				{/* Stepper */}
				<div className={styles.card}>
					<p className={styles.cardLabel}>{t('applicationDetail.applicationState', { defaultValue: 'Application State' })}</p>
					<Stepper steps={STEPS} activeStep={activeStep} />
				</div>

				{/* Badge Info */}
				<div className={styles.badgeCard}>
					<div className={styles.badgeIcon}>
						{imgUrl ? (
							<img src={imgUrl} alt={title} className={styles.badgeIconImg} />
						) : (
							<Icon name="trophy" size={42} color="var(--color-badge-premium)" />
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

				{/* Two Column: Evidence + Requirements */}
				<div className={styles.twoColumn}>
					{/* Left: Evidence Upload */}
					<div className={styles.evidenceCard}>
						<h2 className={styles.sectionTitle}>
							{t('applicationDetail.evidences', { defaultValue: 'My Evidence' })}
						</h2>
						<div className={styles.dropZone}>
							<div className={styles.dropZoneIconWrap}>
								<Icon name="download" size={30} color="var(--color-secondary)" />
							</div>
							<p className={styles.dropZoneLabel}>
								{t('applicationDetail.dragFiles', { defaultValue: 'Drag files or browse' })}
							</p>
							<p className={styles.dropZoneHint}>
								{t('applicationDetail.maxSize', { defaultValue: 'Max size: 10MB' })}
							</p>
						</div>

						{evidencesRaw.length > 0 && (
							<>
								<p className={styles.fileListTitle}>
									{t('applicationDetail.uploadedFiles', { defaultValue: 'Uploaded files' })} ({evidencesRaw.length})
								</p>
								<div className={styles.fileList}>
									{evidencesRaw.map((ev) => {
										const url = ev.evidence_file_url || ev.evidenceFileUrl || ev.url || '';
										const fileName = url.split('/').pop() || 'file';
										return (
											<div key={ev.evidence_id || ev.requirementId} className={styles.fileRow}>
												<div className={styles.fileIconWrap}>
													<Icon name="paper" size={16} color="var(--color-secondary)" />
												</div>
												<div className={styles.fileInfo}>
													<p className={styles.fileName}>{decodeURIComponent(fileName)}</p>
												</div>
											</div>
										);
									})}
								</div>
							</>
						)}
					</div>

					{/* Right: Requirements */}
					<div className={styles.requirementsCard}>
						<h2 className={styles.sectionTitle}>
							{t('applicationDetail.requirementsAndEvidences')}
						</h2>
						<div className={styles.requirementsList}>
							{requirements.map((req, idx) => {
								const reqId = req.requirement_id || req.requirementId || idx;
								const reqTitle = req.requirement_title || req.requirementTitle || t('applicationDetail.requirementN', { n: idx + 1 });
								const reqDesc = req.requirement_description || req.requirementDescription || '';
								const evidence = getEvidenceForRequirement(reqId);
								const isOpen = !!expandedReqs[reqId];

								return (
									<div key={reqId} className={styles.reqItem}>
										<div
											className={styles.reqHeader}
											onClick={() => setExpandedReqs((p) => ({ ...p, [reqId]: !p[reqId] }))}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => e.key === 'Enter' && setExpandedReqs((p) => ({ ...p, [reqId]: !p[reqId] }))}
											aria-expanded={isOpen}
										>
											<div className={styles.reqIconCircle}>
												<Icon name="certificate" size={16} color="var(--color-outline)" />
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
												<div className={styles.reqEvidenceHeader}>
													<span className={styles.reqEvidenceCount}>
														{evidence ? '1' : '0'} {t('applicationDetail.evidenceAssociated', { defaultValue: 'evidence associated' })}
													</span>
												</div>
												<div className={styles.reqInputGroup}>
													<input
														type="url"
														className={styles.reqInput}
														placeholder={t('applicationDetail.evidenceUrlPlaceholder')}
														value={evidenceUrls[reqId] || ''}
														onChange={(e) => handleUrlChange(reqId, e.target.value)}
													/>
													<button
														type="button"
														className={styles.reqSaveBtn}
														onClick={() => handleSaveEvidence(reqId)}
														disabled={!evidenceUrls[reqId]?.trim() || uploading[reqId]}
													>
														{uploading[reqId] ? t('applicationDetail.saving') : t('shared.save')}
													</button>
												</div>
												<input
													type="file"
													className={styles.reqFileInput}
													onChange={(e) => handleFileUpload(reqId, e.target.files[0])}
												/>
												{evidence && (
													<p className={styles.reqEvidenceStatus}>
														<Icon name="check_circle" size={14} color="var(--color-green-on-soft)" />
														{t('applicationDetail.submitted')}
													</p>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Notes */}
				<div className={styles.notesCard}>
					<h2 className={styles.notesTitle}>
						{t('applicationDetail.additionalNotes', { defaultValue: 'Additional Notes' })}
					</h2>
					<textarea
						className={styles.notesTextarea}
						placeholder={t('applicationDetail.notesPlaceholder', { defaultValue: 'Add notes for the reviewers...' })}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>

				{/* Terms */}
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
							{t('applicationDetail.acceptTermsPrefix', { defaultValue: 'I accept the ' })}
							<a href="#terms">{t('applicationDetail.termsLink', { defaultValue: 'terms and conditions' })}</a>
							{t('applicationDetail.acceptTermsMiddle', { defaultValue: ' and the ' })}
							<a href="#privacy">{t('applicationDetail.privacyLink', { defaultValue: 'privacy policy' })}</a>
							{t('applicationDetail.acceptTermsSuffix', { defaultValue: ' of the platform.' })}
						</label>
					</div>
					<p className={styles.disclaimer}>
						{t('applicationDetail.disclaimer', {
							defaultValue:
								'By submitting this application, you declare that all information provided is true and accurate. The platform reserves the right to verify all evidence and may request additional documentation. The evaluation process may take up to 7 business days. Applications with false information will be automatically rejected and may result in account suspension.',
						})}
					</p>
				</div>

				{/* Actions */}
				<div className={styles.actions}>
					<button type="button" className={styles.cancelBtn} onClick={() => navigate(SHARED.APPLICATIONS)}>
						{t('applicationDetail.cancel', { defaultValue: 'Back / Cancel' })}
					</button>
					<button
						type="button"
						className={styles.submitBtn}
						disabled={!termsAccepted || submitting}
						onClick={handleSubmit}
					>
						<Icon name="send" size={16} color="#fff" />
						{submitting
							? t('applicationDetail.submitting', { defaultValue: 'Submitting...' })
							: t('applicationDetail.submitApplication')
						}
					</button>
				</div>
			</div>
		</div>
	);
}
