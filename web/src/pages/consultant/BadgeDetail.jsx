import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBadgeBySlug } from '../../services/badgeService';
import { startApplication, getApplications } from '../../services/applicationService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import FormButton from '../../components/FormButton/FormButton';

export default function BadgeDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const [badge, setBadge] = useState(null);
	const [requirements, setRequirements] = useState([]);
	const [alreadyApplied, setAlreadyApplied] = useState(false);
	const [loading, setLoading] = useState(true);
	const [applying, setApplying] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		loadData();
	}, [slug]);

	async function loadData() {
		try {
			const badgeData = await getBadgeBySlug(slug);
			setBadge(badgeData);
			setRequirements(badgeData?.badge_requirements || badgeData?.badgeRequirements || []);

			const apps = await getApplications();
			const appList = apps.data || apps || [];
			const hasApp = appList.some(
				(a) =>
					(a.badge_id || a.badgeId) === (badgeData?.badge_id || badgeData?.badgeId) &&
					(a.application_state || a.state) !== 'Closed'
			);
			setAlreadyApplied(hasApp);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	async function handleApply() {
		setApplying(true);
		try {
			const newApp = await startApplication(badge.badge_id || badge.badgeId);
			const appGuid = newApp.application_guid || newApp.applicationGuid;
			navigate(`/applications/${appGuid}`);
		} catch (err) {
			setError(err.message);
			setApplying(false);
		}
	}

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				Erro: {error}
			</div>
		);
	}

	if (!badge) {
		return (
			<div className="text-center py-5">
				<h5 className="text-muted">Badge não encontrado</h5>
				<Link to="/badges">Voltar ao catálogo</Link>
			</div>
		);
	}

	return (
		<>
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/badges">Catálogo</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{badge.badge_title || badge.badgeTitle}</li>
				</ol>
			</nav>

			<div className="row">
				<div className="col-lg-8">
					<div className="card border-0 shadow-sm mb-4">
						<div className="card-body">
							<h1 className="h3 mb-2">{badge.badge_title || badge.badgeTitle}</h1>
							<p className="text-muted mb-3">
								{badge.badge_description || badge.badgeDescription || 'Sem descrição disponível.'}
							</p>
							<div className="d-flex flex-wrap gap-2">
								{badge.area?.area_name && (
									<span className="badge bg-info">{badge.area.area_name}</span>
								)}
								{(badge.badge_points || badge.badgePoints) != null && (
									<span className="badge bg-warning text-dark">{badge.badge_points || badge.badgePoints} pontos</span>
								)}
							</div>
						</div>
					</div>

					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h5 className="fw-semibold mb-3">Requisitos</h5>
							{requirements.length === 0 ? (
								<p className="text-muted small">Nenhum requisito definido para este badge.</p>
							) : (
								<div className="d-flex flex-column gap-3">
									{requirements.map((req, idx) => (
										<div
											key={req.requirement_id || req.requirementId || idx}
											className="p-3 rounded border"
											style={{ background: 'var(--color-background)' }}
										>
											<h6 className="fw-semibold mb-1">
												{req.requirement_title || req.requirementTitle || `Requisito ${idx + 1}`}
											</h6>
											<p className="text-muted small mb-0">
												{req.requirement_description || req.requirementDescription || 'Sem descrição.'}
											</p>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="col-lg-4">
					<div className="card border-0 shadow-sm sticky-top" style={{ top: 'calc(var(--topbar-height, 64px) + 24px)' }}>
						<div className="card-body">
							<h5 className="fw-semibold mb-3">Candidatura</h5>
							{alreadyApplied ? (
								<FormButton variant="primary" disabled className="w-100">
									Já se candidatou
								</FormButton>
							) : (
								<FormButton variant="primary" onClick={handleApply} loading={applying} className="w-100">
									Candidatar-me
								</FormButton>
							)}
							<Link to="/badges" className="btn btn-outline-primary w-100 mt-2">
								Voltar ao Catálogo
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
