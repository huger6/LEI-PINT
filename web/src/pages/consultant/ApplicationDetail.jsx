import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplicationById, submitApplication, upsertEvidence } from '../../services/applicationService';
import { getBadgeBySlug } from '../../services/badgeService';
import { uploadFileToTemp } from '../../services/storage';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import FormButton from '../../components/FormButton/FormButton';

const STATE_BADGE_CLASS = {
	Open: 'bg-secondary',
	Submitted: 'bg-primary',
	'In validation': 'bg-warning text-dark',
	Closed: 'bg-success',
};

export default function ApplicationDetail() {
	const { id } = useParams();

	const [application, setApplication] = useState(null);
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [evidences, setEvidences] = useState([]);
	const [evidenceUrls, setEvidenceUrls] = useState({});
	const [uploading, setUploading] = useState({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

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

	function getEvidenceForRequirement(reqId) {
		return evidences.find(
			(ev) => String(ev.requirement_id || ev.requirementId) === String(reqId)
		);
	}

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				Erro: {error}
			</div>
		);
	}

	if (!application) {
		return (
			<div className="text-center py-5">
				<h5 className="text-muted">Candidatura não encontrada</h5>
				<Link to="/applications">Voltar às candidaturas</Link>
			</div>
		);
	}

	const appState = application.application_state || application.state;
	const isOpen = appState === 'Open';
	const badgeName = badge?.badge_title || badge?.badgeTitle || `Badge #${application.badge_id || application.badgeId}`;

	return (
		<>
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/applications">Candidaturas</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{badgeName}</li>
				</ol>
			</nav>

			<div className="d-flex align-items-center gap-3 mb-4">
				<h1 className="h3 mb-0">{badgeName}</h1>
				<span className={`badge ${STATE_BADGE_CLASS[appState] || 'bg-secondary'}`}>
					{appState}
				</span>
			</div>

			{badge && (
				<div className="card border-0 shadow-sm mb-4">
					<div className="card-body">
						<h5 className="fw-semibold mb-2">Informação do Badge</h5>
						<p className="text-muted mb-3">
							{badge.badge_description || badge.badgeDescription || 'Sem descrição.'}
						</p>
						<div className="d-flex flex-wrap gap-2">
							{badge.area?.area_name && <span className="badge bg-info">{badge.area.area_name}</span>}
							{(badge.badge_points || badge.badgePoints) != null && (
								<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} pontos</span>
							)}
						</div>
					</div>
				</div>
			)}

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					<h5 className="fw-semibold mb-3">Requisitos e Evidências</h5>

					{requirements.length === 0 ? (
						<p className="text-muted small">Nenhum requisito definido.</p>
					) : (
						<div className="d-flex flex-column gap-3">
							{requirements.map((req, idx) => {
								const reqId = req.requirement_id || req.requirementId || idx;
								const evidence = getEvidenceForRequirement(reqId);
								const hasEvidence = !!evidence;

								return (
									<div
										key={reqId}
										className="p-3 rounded border"
										style={{ background: hasEvidence ? 'var(--color-success-container)' : 'var(--color-background)' }}
									>
										<div className="d-flex align-items-start justify-content-between mb-2">
											<div>
												<h6 className="fw-semibold mb-1">
													{req.requirement_title || req.requirementTitle || `Requisito ${idx + 1}`}
												</h6>
												<p className="text-muted small mb-0">
													{req.requirement_description || req.requirementDescription || 'Sem descrição.'}
												</p>
											</div>
											<span className={`small fw-medium ${hasEvidence ? 'text-success' : 'text-muted'}`}>
												{hasEvidence ? 'Submetido' : 'Pendente'}
											</span>
										</div>

										{isOpen ? (
											<div className="d-flex flex-column gap-2 mt-2">
												<div className="d-flex gap-2">
													<input
														type="url"
														className="form-control form-control-sm"
														placeholder="URL do ficheiro de evidência"
														value={evidenceUrls[reqId] || ''}
														onChange={(e) => handleUrlChange(reqId, e.target.value)}
													/>
													<button
														className="btn btn-outline-primary btn-sm text-nowrap"
														onClick={() => handleSaveEvidence(reqId)}
														disabled={!evidenceUrls[reqId]?.trim() || uploading[reqId]}
													>
														{uploading[reqId] ? 'A guardar...' : 'Guardar'}
													</button>
												</div>
												<div className="d-flex align-items-center gap-2">
													<input
														type="file"
														className="form-control form-control-sm"
														onChange={(e) => handleFileUpload(reqId, e.target.files[0])}
													/>
													{uploading[reqId] && (
														<span className="spinner-border spinner-border-sm text-primary" />
													)}
												</div>
											</div>
										) : hasEvidence ? (
											<div className="mt-2">
												<a
													href={evidence.evidence_file_url || evidence.evidenceFileUrl || evidence.url}
													target="_blank"
													rel="noopener noreferrer"
													className="small"
												>
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
							Submeter Candidatura
						</FormButton>
					)}
				</div>
			</div>
		</>
	);
}
