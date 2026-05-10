import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getApplications } from '../../services/applicationService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';

const STATE_BADGE_MAP = {
	Open: 'badge-open',
	Submitted: 'badge-submitted',
	'In validation': 'badge-validation',
	Closed: 'badge-closed',
};

const TABS = [
	{ key: 'all', label: 'Todas' },
	{ key: 'Open', label: 'Em Aberto' },
	{ key: 'Submitted', label: 'Submetidas' },
	{ key: 'In validation', label: 'Em Validação' },
	{ key: 'Closed', label: 'Concluídas' },
];

export default function MyApplications() {
	const navigate = useNavigate();
	const [applications, setApplications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState('all');

	useEffect(() => {
		loadApplications();
	}, []);

	async function loadApplications() {
		try {
			const data = await getApplications();
			setApplications(data.data || data || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	const stats = useMemo(() => {
		const total = applications.length;
		const open = applications.filter((a) => (a.application_state || a.state) === 'Open').length;
		const submitted = applications.filter((a) => (a.application_state || a.state) === 'Submitted').length;
		const validation = applications.filter((a) => (a.application_state || a.state) === 'In validation').length;
		const closed = applications.filter((a) => (a.application_state || a.state) === 'Closed').length;
		return { total, open, submitted, validation, closed };
	}, [applications]);

	const filtered = useMemo(() => {
		if (activeTab === 'all') return applications;
		return applications.filter((a) => (a.application_state || a.state) === activeTab);
	}, [applications, activeTab]);

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				Erro ao carregar candidaturas: {error}
			</div>
		);
	}

	const statCards = [
		{ label: 'Total', value: stats.total, icon: 'bi-layers', color: 'var(--color-on-surface)' },
		{ label: 'Em Aberto', value: stats.open, icon: 'bi-hourglass-split', color: 'var(--color-primary)' },
		{ label: 'Submetidas', value: stats.submitted, icon: 'bi-send-check', color: 'var(--color-secondary)' },
		{ label: 'Concluídas', value: stats.closed, icon: 'bi-check-circle', color: 'var(--color-success)' },
	];

	return (
		<>
			{/* Page Header */}
			<div className="d-flex align-items-center justify-content-between mb-2">
				<h1 className="page-title">As Minhas Candidaturas</h1>
				<Link to="/catalog" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.8125rem' }}>
					<i className="bi bi-plus-lg me-1" />
					Explorar Badges
				</Link>
			</div>
			<p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>Acompanhe o estado das suas candidaturas a badges.</p>

			{/* Stat Cards */}
			<div className="row g-3 mb-4">
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
								<h3 className="mb-0" style={{ color: card.color, fontWeight: 800, fontSize: '1.5rem' }}>{card.value}</h3>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Tab Filters */}
			<div className="d-flex gap-1 mb-4 flex-wrap" role="tablist">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						role="tab"
						aria-selected={activeTab === tab.key}
						className="btn btn-sm"
						onClick={() => setActiveTab(tab.key)}
						style={{
							borderRadius: 20,
							padding: '5px 16px',
							fontSize: '0.8125rem',
							fontWeight: 600,
							border: activeTab === tab.key ? '1.5px solid var(--color-primary)' : '1.5px solid #DEE3E6',
							background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
							color: activeTab === tab.key ? '#fff' : 'var(--color-outline)',
							transition: 'all 200ms ease',
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Applications List */}
			{filtered.length === 0 ? (
				<div className="card border-0 shadow-sm brand-card" style={{ borderRadius: 14 }}>
					<div className="card-body text-center py-5">
						<i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--color-primary)', opacity: 0.35 }} />
						<h5 className="mt-3 mb-2" style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
							{activeTab === 'all' ? 'Sem candidaturas' : `Sem candidaturas "${TABS.find(t => t.key === activeTab)?.label}"`}
						</h5>
						<p className="text-muted small mb-3">
							{activeTab === 'all'
								? 'Explore o catálogo e candidate-se ao seu primeiro badge!'
								: 'Não existem candidaturas neste estado.'}
						</p>
						{activeTab === 'all' && (
							<Link to="/catalog" className="btn btn-primary btn-sm" style={{ borderRadius: 8, fontWeight: 600 }}>
								<i className="bi bi-search me-1" />
								Explorar Catálogo
							</Link>
						)}
					</div>
				</div>
			) : (
				<div className="d-flex flex-column gap-3">
					{filtered.map((app) => {
						const state = app.application_state || app.state;
						const badgeName = app.badge?.badge_title || app.badge?.badgeTitle || `Badge #${app.badge_id || app.badgeId}`;
						const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
						const date = dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : '—';
						const borderColor = {
							Open: 'var(--color-primary)',
							Submitted: 'var(--color-secondary)',
							'In validation': 'var(--color-warning)',
							Closed: 'var(--color-success)',
						}[state] || 'var(--color-outline)';

						return (
							<div
								key={app.application_guid || app.applicationGuid}
								className="card border-0 shadow-sm"
								onClick={() => navigate(`/applications/${app.application_guid || app.applicationGuid}`)}
								style={{
									borderRadius: 14,
									borderLeft: `3px solid ${borderColor}`,
									cursor: 'pointer',
									transition: 'transform 250ms cubic-bezier(0.22,1,0.36,1), box-shadow 250ms ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.transform = 'translateY(-2px)';
									e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.07)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = '';
								}}
							>
								<div className="card-body d-flex align-items-center gap-3 py-3">
									{/* Badge icon */}
									<div
										className="d-flex align-items-center justify-content-center flex-shrink-0"
										style={{
											width: 44, height: 44, borderRadius: 10,
											background: 'linear-gradient(135deg, rgba(0,184,224,0.08) 0%, rgba(57,99,156,0.08) 100%)',
										}}
									>
										<i className="bi bi-award" style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
									</div>

									{/* Content */}
									<div className="flex-grow-1 min-width-0">
										<div className="fw-bold" style={{ fontSize: '0.9375rem' }}>{badgeName}</div>
										<div className="d-flex align-items-center gap-2 mt-1">
											<span className={`badge ${STATE_BADGE_MAP[state] || 'badge-open'}`} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
												{state}
											</span>
											<span className="text-muted" style={{ fontSize: '0.75rem' }}>·</span>
											<span className="text-muted" style={{ fontSize: '0.75rem' }}>{date}</span>
										</div>
									</div>

									{/* Arrow */}
									<i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.875rem' }} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</>
	);
}
