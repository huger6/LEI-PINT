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
				<i className="bi bi-exclamation-triangle" style={{ fontSize: '2.5rem', color: 'var(--color-warning)', opacity: 0.5 }} />
				<h5 className="mt-3" style={{ fontWeight: 700 }}>Badge não encontrado</h5>
				<Link to="/catalog" className="btn btn-outline-primary btn-sm mt-2" style={{ borderRadius: 8, fontWeight: 600 }}>
					Voltar ao catálogo
				</Link>
			</div>
		);
	}

	const title = badge.badge_title || badge.badgeTitle;
	const description = badge.badge_description || badge.badgeDescription;
	const areaName = badge.area?.area_name;
	const points = badge.badge_points || badge.badgePoints;
	const imgUrl = badge.badge_img_url || badge.badgeImgUrl;

	return (
		<>
			{/* Breadcrumb */}
			<nav aria-label="breadcrumb" className="mb-3">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><Link to="/catalog">Catálogo</Link></li>
					<li className="breadcrumb-item active" aria-current="page">{title}</li>
				</ol>
			</nav>

			<div className="row g-4">
				{/* Main Content */}
				<div className="col-lg-8">
					{/* Badge Info Card */}
					<div className="card border-0 shadow-sm brand-card mb-4" style={{ borderRadius: 14, overflow: 'hidden' }}>
						{/* Header Area */}
						<div
							className="d-flex align-items-center justify-content-center"
							style={{
								height: 160,
								background: 'linear-gradient(135deg, rgba(0,184,224,0.08) 0%, rgba(57,99,156,0.08) 100%)',
							}}
						>
							{imgUrl ? (
								<img src={imgUrl} alt={title} style={{ maxHeight: 110, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
							) : (
								<i className="bi bi-award" style={{ fontSize: '3.5rem', color: 'var(--color-primary)', opacity: 0.45 }} />
							)}
						</div>

						<div className="card-body">
							<h1 className="mb-2" style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
							<p className="text-muted mb-3" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
								{description || 'Sem descrição disponível.'}
							</p>
							<div className="d-flex flex-wrap gap-2">
								{areaName && (
									<span className="badge badge-area" style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 8 }}>
										{areaName}
									</span>
								)}
								{points != null && (
									<span className="badge badge-points" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>
										<i className="bi bi-star-fill me-1" style={{ fontSize: '0.625rem' }} />
										{points} pontos
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Requirements Card */}
					<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
						<div className="card-body">
							<h5 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Requisitos</h5>
							{requirements.length === 0 ? (
								<div className="text-center py-4">
									<i className="bi bi-clipboard-check" style={{ fontSize: '2rem', color: 'var(--color-outline)', opacity: 0.3 }} />
									<p className="text-muted small mt-2 mb-0">Nenhum requisito definido para este badge.</p>
								</div>
							) : (
								<div className="d-flex flex-column gap-3">
									{requirements.map((req, idx) => (
										<div
											key={req.requirement_id || req.requirementId || idx}
											className="p-3 rounded-3"
											style={{
												background: 'var(--color-background)',
												border: '1px solid #e8ecef',
											}}
										>
											<div className="d-flex align-items-start gap-3">
												<div
													className="d-flex align-items-center justify-content-center flex-shrink-0"
													style={{
														width: 28, height: 28, borderRadius: 8,
														background: 'var(--color-primary-container)',
														fontSize: '0.75rem', fontWeight: 700,
														color: 'var(--color-on-primary-container)',
													}}
												>
													{idx + 1}
												</div>
												<div>
													<h6 className="fw-bold mb-1" style={{ fontSize: '0.875rem' }}>
														{req.requirement_title || req.requirementTitle || `Requisito ${idx + 1}`}
													</h6>
													<p className="text-muted mb-0" style={{ fontSize: '0.8125rem' }}>
														{req.requirement_description || req.requirementDescription || 'Sem descrição.'}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className="col-lg-4">
					<div className="card border-0 shadow-sm brand-card sticky-top" style={{ top: 'calc(57px + 24px)', borderRadius: 14 }}>
						<div className="card-body">
							<h5 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Candidatura</h5>

							{/* Quick info */}
							<div className="d-flex flex-column gap-2 mb-4">
								{areaName && (
									<div className="d-flex align-items-center gap-2">
										<i className="bi bi-folder2" style={{ color: 'var(--color-outline)', fontSize: '0.875rem' }} />
										<span style={{ fontSize: '0.8125rem', color: 'var(--color-outline)' }}>Área: <strong style={{ color: 'var(--color-on-surface)' }}>{areaName}</strong></span>
									</div>
								)}
								{points != null && (
									<div className="d-flex align-items-center gap-2">
										<i className="bi bi-star" style={{ color: 'var(--color-warning)', fontSize: '0.875rem' }} />
										<span style={{ fontSize: '0.8125rem', color: 'var(--color-outline)' }}>Pontos: <strong style={{ color: 'var(--color-on-surface)' }}>{points}</strong></span>
									</div>
								)}
								<div className="d-flex align-items-center gap-2">
									<i className="bi bi-list-check" style={{ color: 'var(--color-outline)', fontSize: '0.875rem' }} />
									<span style={{ fontSize: '0.8125rem', color: 'var(--color-outline)' }}>Requisitos: <strong style={{ color: 'var(--color-on-surface)' }}>{requirements.length}</strong></span>
								</div>
							</div>

							{alreadyApplied ? (
								<FormButton variant="primary" disabled className="w-100" style={{ borderRadius: 10 }}>
									<i className="bi bi-check-lg me-1" />
									Já se candidatou
								</FormButton>
							) : (
								<FormButton variant="primary" onClick={handleApply} loading={applying} className="w-100" style={{ borderRadius: 10 }}>
									<i className="bi bi-send me-1" />
									Candidatar-me
								</FormButton>
							)}
							<Link to="/catalog" className="btn btn-outline-primary w-100 mt-2" style={{ borderRadius: 10, fontWeight: 600, fontSize: '0.875rem' }}>
								← Voltar ao Catálogo
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
