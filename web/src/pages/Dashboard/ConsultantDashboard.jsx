import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WelcomeCard from '../../components/WelcomeCard/WelcomeCard';
import { getApplications } from '../../services/applicationService';
import { getBadges } from '../../services/badgeService';

const STATE_BADGE_MAP = {
	Open: 'badge-open',
	Submitted: 'badge-submitted',
	'In validation': 'badge-validation',
	Closed: 'badge-closed',
};

export default function ConsultantDashboard() {
	const navigate = useNavigate();
	const [stats, setStats] = useState({ total: 0, open: 0, submitted: 0, closed: 0 });
	const [recentApps, setRecentApps] = useState([]);
	const [recommendedBadges, setRecommendedBadges] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let ignore = false;

		async function load() {
			try {
				setLoading(true);
				const [appData, badgesData] = await Promise.all([
					getApplications().catch(() => []),
					getBadges().catch(() => [])
				]);
				
				if (ignore) return;

				const apps = appData.data || appData || [];
				const badges = badgesData.data || badgesData || [];

				const total = apps.length;
				const open = apps.filter((a) => (a.application_state || a.state) === 'Open').length;
				const submitted = apps.filter((a) => (a.application_state || a.state) === 'Submitted').length;
				const closed = apps.filter((a) => (a.application_state || a.state) === 'Closed').length;

				setStats({ total, open, submitted, closed });
				
				// Sort by date descending
				const sortedApps = [...apps].sort((a, b) => {
					const dateA = new Date(a.submitted_at || a.submittedAt || a.opened_at || a.createdAt || 0);
					const dateB = new Date(b.submitted_at || b.submittedAt || b.opened_at || b.createdAt || 0);
					return dateB - dateA;
				});
				setRecentApps(sortedApps.slice(0, 4));

				// Filter out badges user already applied for and show 3 random/first ones
				const appliedBadgeIds = new Set(apps.map(a => a.badge_id || a.badgeId));
				const availableBadges = badges.filter(b => !appliedBadgeIds.has(b.badge_id || b.badgeId));
				setRecommendedBadges(availableBadges.slice(0, 3));
			} catch (err) {
				console.error('Erro ao carregar dashboard:', err);
			} finally {
				if (!ignore) setLoading(false);
			}
		}

		load();
		return () => { ignore = true; };
	}, []);

	const statCards = [
		{ label: 'Candidaturas', value: stats.total, icon: 'bi-layers', color: 'var(--color-on-surface)' },
		{ label: 'Em Aberto', value: stats.open, icon: 'bi-hourglass-split', color: 'var(--color-primary)' },
		{ label: 'Submetidas', value: stats.submitted, icon: 'bi-send-check', color: 'var(--color-secondary)' },
		{ label: 'Concluídas', value: stats.closed, icon: 'bi-check-circle', color: 'var(--color-success)' },
	];

	return (
		<div>
			<WelcomeCard />

			{/* Stat Cards - Adjusted spacing and visual hierarchy */}
			<div className="row g-3 mb-4 mt-2">
				{statCards.map((card) => (
					<div className="col-6 col-md-3" key={card.label}>
						<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
							<div className="card-body py-3">
								<div className="d-flex align-items-center gap-2 mb-2">
									<i className={`bi ${card.icon}`} style={{ color: card.color, fontSize: '1rem' }} />
									<span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
										{card.label}
									</span>
								</div>
								<h3 className="mb-0" style={{ color: card.color, fontWeight: 800, fontSize: '1.5rem' }}>{loading ? '-' : card.value}</h3>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="row g-4 mb-4">
				{/* Recent Applications - Converted from Table to Modern List */}
				<div className="col-lg-7">
					<div className="card border-0 shadow-sm brand-card h-100" style={{ borderRadius: 14 }}>
						<div className="card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
							<h5 className="fw-bold mb-0" style={{ fontSize: '1.0625rem' }}>Atividade Recente</h5>
							<Link to="/applications" className="small text-decoration-none" style={{ fontWeight: 600 }}>Ver todas</Link>
						</div>
						<div className="card-body p-0">
							{loading ? (
								<div className="text-center py-5">
									<div className="spinner-border spinner-border-sm text-primary" />
								</div>
							) : recentApps.length === 0 ? (
								<div className="text-center py-5 px-4">
									<i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--color-outline)', opacity: 0.3 }} />
									<p className="text-muted small mb-3 mt-3">Ainda não iniciou nenhuma candidatura.</p>
									<Link to="/catalog" className="btn btn-outline-primary btn-sm" style={{ borderRadius: 8, fontWeight: 600 }}>
										Explorar Catálogo
									</Link>
								</div>
							) : (
								<div className="list-group list-group-flush pb-2">
									{recentApps.map((app, idx) => {
										const state = app.application_state || app.state;
										const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
										return (
											<button
												key={app.application_guid || app.applicationGuid}
												className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 px-4"
												onClick={() => navigate(`/applications/${app.application_guid || app.applicationGuid}`)}
												style={{ borderBottom: idx < recentApps.length - 1 ? '1px solid #f0f2f4' : 'none' }}
											>
												<div 
													className="d-flex align-items-center justify-content-center flex-shrink-0" 
													style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,184,224,0.08) 0%, rgba(57,99,156,0.08) 100%)' }}
												>
													<i className="bi bi-award" style={{ color: 'var(--color-primary)' }} />
												</div>
												<div className="flex-grow-1 min-width-0">
													<div className="fw-semibold text-truncate" style={{ fontSize: '0.875rem', color: 'var(--color-on-surface)' }}>
														{app.badge?.badge_title || app.badge?.badgeTitle || 'Badge sem título'}
													</div>
													<div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
														Atualizado a {dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : '—'}
													</div>
												</div>
												<div className="flex-shrink-0 ms-2">
													<span className={`badge ${STATE_BADGE_MAP[state] || 'badge-open'}`} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
														{state}
													</span>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Quick Actions & Recommendations */}
				<div className="col-lg-5">
					<div className="d-flex flex-column gap-4 h-100">
						
						{/* Quick Actions - Rich Tiles */}
						<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
							<div className="card-header bg-transparent border-0 pt-4 pb-2 px-4">
								<h5 className="fw-bold mb-0" style={{ fontSize: '1.0625rem' }}>Ações Rápidas</h5>
							</div>
							<div className="card-body px-4 pb-4 pt-2">
								<div className="d-flex flex-column gap-3">
									<Link to="/catalog" className="text-decoration-none p-3 rounded-3 d-flex align-items-center gap-3" style={{ border: '1px solid #e8ecef', transition: 'all 200ms ease' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'var(--color-primary-hover-bg-soft)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecef'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
										<div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}>
											<i className="bi bi-search" />
										</div>
										<div>
											<h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.875rem' }}>Explorar Catálogo</h6>
											<p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Descubra novos badges e certificações</p>
										</div>
										<i className="bi bi-chevron-right ms-auto text-muted" style={{ fontSize: '0.875rem' }} />
									</Link>
									
									<Link to="/applications" className="text-decoration-none p-3 rounded-3 d-flex align-items-center gap-3" style={{ border: '1px solid #e8ecef', transition: 'all 200ms ease' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-secondary)'; e.currentTarget.style.backgroundColor = 'var(--color-secondary-container-hover)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecef'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
										<div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 40, height: 40, backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
											<i className="bi bi-file-earmark-check" />
										</div>
										<div>
											<h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.875rem' }}>Minhas Candidaturas</h6>
											<p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Acompanhe o estado das submissões</p>
										</div>
										<i className="bi bi-chevron-right ms-auto text-muted" style={{ fontSize: '0.875rem' }} />
									</Link>
								</div>
							</div>
						</div>

						{/* Recommended Badges widget */}
						<div className="card border-0 shadow-sm brand-card flex-grow-1" style={{ borderRadius: 14 }}>
							<div className="card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
								<h5 className="fw-bold mb-0" style={{ fontSize: '1.0625rem' }}>Recomendados</h5>
								<i className="bi bi-stars text-warning" />
							</div>
							<div className="card-body px-4 pb-4 pt-2">
								{loading ? (
									<div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary" /></div>
								) : recommendedBadges.length === 0 ? (
									<p className="text-muted small mb-0">Não há novas recomendações no momento.</p>
								) : (
									<div className="d-flex flex-column gap-3">
										{recommendedBadges.map(badge => (
											<Link 
												key={badge.badge_slug} 
												to={`/badges/${badge.badge_slug}`}
												className="d-flex align-items-center gap-3 text-decoration-none"
												style={{ padding: '8px 0', borderBottom: '1px solid #f0f2f4' }}
											>
												<div className="flex-grow-1 min-width-0">
													<h6 className="mb-1 text-dark text-truncate fw-semibold" style={{ fontSize: '0.875rem' }}>{badge.badge_title}</h6>
													<div className="d-flex align-items-center gap-2">
														{badge.area?.area_name && <span className="text-muted" style={{ fontSize: '0.6875rem' }}>{badge.area.area_name}</span>}
														{badge.badge_points && (
															<>
																<span className="text-muted" style={{ fontSize: '0.6875rem' }}>•</span>
																<span className="text-warning fw-bold" style={{ fontSize: '0.6875rem' }}>{badge.badge_points} pts</span>
															</>
														)}
													</div>
												</div>
												<div className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28, backgroundColor: 'var(--color-primary-hover-bg-soft)', color: 'var(--color-primary)' }}>
													<i className="bi bi-arrow-right" style={{ fontSize: '0.875rem' }} />
												</div>
											</Link>
										))}
									</div>
								)}
							</div>
						</div>

					</div>
				</div>
			</div>
		</div>
	);
}