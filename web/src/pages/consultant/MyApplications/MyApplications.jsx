import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../../../services/applicationService';
import LoadingScreen from '../../../components/LoadingScreen/LoadingScreen';
import styles from './MyApplications.module.css';

const STATE_BADGE_CLASS = {
	Open: 'bg-secondary',
	Submitted: 'bg-primary',
	'In validation': 'bg-warning text-dark',
	Closed: 'bg-success',
};

export default function MyApplications() {
	const { t } = useTranslation();
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
				{t('myApplications.errorLoading', { error })}
			</div>
		);
	}

	return (
		<>
			<h1 className="h3 mb-4">{t('myApplications.title')}</h1>

			{applications.length === 0 ? (
				<div className="card border-0 shadow-sm">
					<div className="card-body text-center py-5">
						<h5 className="text-muted">{t('myApplications.noApplications')}</h5>
						<p className="text-muted small">{t('myApplications.noApplicationsDesc')}</p>
					</div>
				</div>
			) : (
				<div className="card border-0 shadow-sm">
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead className="table-light">
								<tr>
									<th>{t('shared.badge')}</th>
									<th>{t('shared.state')}</th>
									<th>{t('shared.submissionDate')}</th>
									<th className="text-end">{t('shared.actions')}</th>
								</tr>
							</thead>
							<tbody>
								{applications.map((app) => {
									const state = app.application_state || app.state;
									return (
										<tr
											key={app.application_guid || app.applicationGuid}
											className={styles.clickableRow}
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
													title={t('myApplications.viewDetails')}
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
