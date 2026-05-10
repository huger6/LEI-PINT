import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../../services/applicationService';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';

const STATE_BADGE_CLASS = {
	Open: 'bg-secondary',
	Submitted: 'bg-primary',
	'In validation': 'bg-warning text-dark',
	Closed: 'bg-success',
};

export default function MyApplications() {
	const navigate = useNavigate();
	const [applications, setApplications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

	if (loading) return <LoadingScreen />;

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				Erro ao carregar candidaturas: {error}
			</div>
		);
	}

	return (
		<>
			<h1 className="h3 mb-4">As Minhas Candidaturas</h1>

			{applications.length === 0 ? (
				<div className="card border-0 shadow-sm">
					<div className="card-body text-center py-5">
						<h5 className="text-muted">Sem candidaturas</h5>
						<p className="text-muted small">Ainda não se candidatou a nenhum badge.</p>
					</div>
				</div>
			) : (
				<div className="card border-0 shadow-sm">
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead className="table-light">
								<tr>
									<th>Badge</th>
									<th>Estado</th>
									<th>Data Submissão</th>
									<th className="text-end">Ações</th>
								</tr>
							</thead>
							<tbody>
								{applications.map((app) => {
									const state = app.application_state || app.state;
									return (
										<tr
											key={app.application_guid || app.applicationGuid}
											style={{ cursor: 'pointer' }}
											onClick={() => navigate(`/applications/${app.application_guid || app.applicationGuid}`)}
										>
											<td className="fw-medium">
												{app.badge?.badge_title || app.badge?.badgeTitle || `Badge #${app.badge_id || app.badgeId}`}
											</td>
											<td>
												<span className={`badge ${STATE_BADGE_CLASS[state] || 'bg-secondary'}`}>
													{state}
												</span>
											</td>
											<td className="text-muted">
												{app.submitted_at || app.submittedAt
													? new Date(app.submitted_at || app.submittedAt).toLocaleDateString('pt-PT')
													: app.opened_at || app.createdAt
														? new Date(app.opened_at || app.createdAt).toLocaleDateString('pt-PT')
														: '—'}
											</td>
											<td className="text-end">
												<button
													className="btn btn-sm btn-outline-primary"
													title="Ver detalhes"
													onClick={(e) => {
														e.stopPropagation();
														navigate(`/applications/${app.application_guid || app.applicationGuid}`);
													}}
												>
													<i className="bi bi-arrow-right" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
