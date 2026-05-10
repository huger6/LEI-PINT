import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplicationById, submitApplication, upsertEvidence } from '../../../services/applicationService';
import { getBadgeBySlug } from '../../../services/badgeService';
import { uploadFileToTemp } from '../../../services/storage';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import FormButton from '../../../components/FormButton/FormButton';
import Icon from '../../../components/Icons/Icons';
import styles from './ApplicationDetail.module.css';

const STATE_BADGE_MAP = {
	Open: 'badge-open',
	Submitted: 'badge-submitted',
	'In validation': 'badge-validation',
	Closed: 'badge-closed',
};

export default function ApplicationDetail() {
	const { t } = useTranslation();
	const { id } = useParams();

	const [application, setApplication] = useState(null);
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [evidences, setEvidences] = useState([]);
	const [evidenceUrls, setEvidenceUrls] = useState({});
	const [uploading, setUploading] = useState({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		let ignore = false;

		async function load() {
			try {
				const app = await getApplicationById(id);
				if (ignore) return;
				setApplication(app);

				const badgeSlug = app.badge?.badge_slug || app.badge?.badgeSlug;
				if (badgeSlug) {
					const badgeData = await getBadgeBySlug(badgeSlug);
					if (!ignore) {
						setBadge(badgeData);
						setRequirements(badgeData?.badge_requirements || badgeData?.badgeRequirements || []);
					}
				}

				if (ignore) return;
				setEvidences(app.requirements_evidences || app.requirementsEvidences || []);

				const urlMap = {};
				(app.requirements_evidences || app.requirementsEvidences || []).forEach((ev) => {
					const reqId = ev.requirement_id || ev.requirementId;
					urlMap[reqId] = ev.evidence_file_url || ev.evidenceFileUrl || ev.url || '';
				});
				if (!ignore) setEvidenceUrls(urlMap);
			} catch (err) {
				if (!ignore) setError(err.message);
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => { ignore = true; };
	}, [id]);

	function handleUrlChange(requirementId, value) {
		setEvidenceUrls((prev) => ({ ...prev, [requirementId]: value }));
	}

	async function handleSaveEvidence(requirementId) {
		const url = evidenceUrls[requirementId];
		if (!url?.trim()) return;
		try {
			await upsertEvidence(id, {
				requirementId,
				evidenceFileUrl: url,
			});
			const app = await getApplicationById(id);
			setEvidences(app.requirements_evidences || app.requirementsEvidences || []);
		} catch (err) {
			setError(err.message);
		}
	}

	async function handleFileUpload(requirementId, file) {
		if (!file) return;
		setUploading((prev) => ({ ...prev, [requirementId]: true }));
		try {
			const { publicUrl } = await uploadFileToTemp(file);
			setEvidenceUrls((prev) => ({ ...prev, [requirementId]: publicUrl }));
			await upsertEvidence(id, {
				requirementId,
				evidenceFileUrl: publicUrl,
			});
			const app = await getApplicationById(id);
			setEvidences(app.requirements_evidences || app.requirementsEvidences || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setUploading((prev) => ({ ...prev, [requirementId]: false }));
		}
	}

	async function handleSubmit() {
		setSubmitting(true);
		try {
			const updated = await submitApplication(id);
			setApplication(updated);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleDelete() {
		if (!window.confirm("Tem a certeza que pretende remover esta candidatura? Esta ação é irreversível.")) return;
		setDeleting(true);
		try {
			await deleteApplication(id);
			navigate('/applications');
		} catch (err) {
			setError(err.message);
			setDeleting(false);
		}
	}

	function getEvidenceForRequirement(reqId) {
		return evidences.find(
			(ev) => String(ev.requirement_id || ev.requirementId) === String(reqId)
		);
	}

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('shared.error')}: {error}
			</div>
		);
	}

	if (!application) {
		return (
			<div className="text-center py-5">
				<h5 className="text-muted">{t('applicationDetail.notFound')}</h5>
				<Link to="/applications">{t('applicationDetail.backToApplications')}</Link>
			</div>
		);
	}

	const appState = application.application_state || application.state;
	const isOpen = appState === 'Open';
	const badgeName = badge?.badge_title || badge?.badgeTitle || `Badge #${application.badge_id || application.badgeId}`;
	const completedCount = requirements.filter((req) => {
		const reqId = req.requirement_id || req.requirementId;
		return !!getEvidenceForRequirement(reqId);
	}).length;
	const progressPct = requirements.length > 0 ? Math.round((completedCount / requirements.length) * 100) : 0;

	return (
		<>
			{/* Breadcrumb */}
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/applications">{t('applicationDetail.applications')}</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{badgeName}</li>
				</ol>
			</nav>

			{/* Page Header */}
			<div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
				<h1 className="page-title mb-0">{badgeName}</h1>
				<span
					className={`badge ${STATE_BADGE_MAP[appState] || 'badge-open'}`}
					style={{ fontSize: '0.75rem', fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}
				>
					{appState}
				</span>
			</div>

			{/* Badge Info + Progress Card */}
			{badge && (
				<div className="card border-0 shadow-sm brand-card mb-4" style={{ borderRadius: 14 }}>
					<div className="card-body">
						<h5 className="fw-semibold mb-2">{t('applicationDetail.badgeInfo')}</h5>
						<p className="text-muted mb-3">
							{badge.badge_description || badge.badgeDescription || t('shared.noDescription')}
						</p>
						<div className="d-flex flex-wrap gap-2">
							{badge.area?.area_name && <span className="badge bg-info">{badge.area.area_name}</span>}
							{(badge.badge_points || badge.badgePoints) != null && (
								<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} {t('badgeDetail.pointsLabel')}</span>
							)}
						</div>

						{/* Progress Bar */}
						<div className="d-flex align-items-center gap-3">
							<div className="flex-grow-1">
								<div style={{ background: '#f0f2f4', borderRadius: 6, height: 8, overflow: 'hidden' }}>
									<div
										style={{
											width: `${progressPct}%`,
											height: '100%',
											borderRadius: 6,
											background: progressPct === 100
												? 'var(--color-success)'
												: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
											transition: 'width 400ms ease',
										}}
									/>
								</div>
							</div>
							<span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-outline)', whiteSpace: 'nowrap' }}>
								{completedCount}/{requirements.length} requisitos
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Requirements & Evidences */}
			<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
				<div className="card-body">
					<h5 className="fw-semibold mb-3">{t('applicationDetail.requirementsAndEvidences')}</h5>

					{requirements.length === 0 ? (
						<p className="text-muted small">{t('applicationDetail.noRequirements')}</p>
					) : (
						<div className="d-flex flex-column gap-3">
							{requirements.map((req, idx) => {
								const reqId = req.requirement_id || req.requirementId || idx;
								const evidence = getEvidenceForRequirement(reqId);
								const hasEvidence = !!evidence;

								return (
									<div
										key={reqId}
										className={`p-3 rounded border ${hasEvidence ? styles.evidenceBlockSubmitted : styles.evidenceBlock}`}
									>
										<div className="d-flex align-items-start justify-content-between mb-2">
											<div>
												<h6 className="fw-semibold mb-1">
													{req.requirement_title || req.requirementTitle || t('applicationDetail.requirementN', { n: idx + 1 })}
												</h6>
												<p className="text-muted small mb-0">
													{req.requirement_description || req.requirementDescription || t('shared.noDescription')}
												</p>
											</div>
											<span className={`small fw-medium ${hasEvidence ? 'text-success' : 'text-muted'}`}>
												{hasEvidence ? t('applicationDetail.submitted') : t('applicationDetail.pending')}
											</span>
										</div>

										{isOpen ? (
											<div className="d-flex flex-column gap-2 mt-2 ms-5">
												<div className="d-flex gap-2">
													<input
														type="url"
														className="form-control form-control-sm"
														placeholder={t('applicationDetail.evidenceUrlPlaceholder')}
														value={evidenceUrls[reqId] || ''}
														onChange={(e) => handleUrlChange(reqId, e.target.value)}
														style={{ borderRadius: 8, fontSize: '0.8125rem' }}
													/>
													<button
														className="btn btn-outline-primary btn-sm text-nowrap"
														onClick={() => handleSaveEvidence(reqId)}
														disabled={!evidenceUrls[reqId]?.trim() || uploading[reqId]}
														style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem' }}
													>
														{uploading[reqId] ? t('applicationDetail.saving') : t('shared.save')}
													</button>
												</div>
												<div className="d-flex align-items-center gap-2">
													<input
														type="file"
														className="form-control form-control-sm"
														onChange={(e) => handleFileUpload(reqId, e.target.files[0])}
														style={{ borderRadius: 8, fontSize: '0.8125rem' }}
													/>
													{uploading[reqId] && (
														<span className="spinner-border spinner-border-sm text-primary" />
													)}
												</div>
											</div>
										) : hasEvidence ? (
											<div className="mt-2 ms-5">
												<a
													href={evidence.evidence_file_url || evidence.evidenceFileUrl || evidence.url}
													target="_blank"
													rel="noopener noreferrer"
													className="small"
													style={{ fontWeight: 500 }}
												>
													<Icon name="link" size={14} className="me-1" aria-hidden="true" />
													{evidence.evidence_file_url || evidence.evidenceFileUrl || evidence.url}
												</a>
											</div>
										) : null}
									</div>
								);
							})}
						</div>
					)}

					{isOpen && (
						<FormButton variant="primary" className="mt-4" onClick={handleSubmit} loading={submitting}>
							{t('applicationDetail.submitApplication')}
						</FormButton>
					)}
				</div>
			</div>
		</>
	);
}
