import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';

const STATE_BADGE_CLASS = {
	Open: 'bg-secondary',
	Submitted: 'bg-primary',
	'In validation': 'bg-warning text-dark',
	Closed: 'bg-success',
};

export default function AdminApplications() {
	// Initialize translation hook for i18n support.
	const { t } = useTranslation();
	// Store the list of fetched applications.
	const [applications, setApplications] = useState([]);
	// Track whether data is still being loaded.
	const [loading, setLoading] = useState(true);

	// Fetch applications on initial mount.
	useEffect(() => {
		loadApplications();
	}, []);

	// Fetch all applications from the API and update state.
	async function loadApplications() {
		try {
			const data = await getApplications();
			setApplications(data.data || data || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<h1 className="h3 mb-4">{t('adminApplications.title')}</h1>
			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<TableSkeleton rows={5} columns={4} />
					) : applications.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminApplications.noApplications')}</h5>
							<p className="text-muted small">{t('adminApplications.noApplicationsDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.badge')}</th>
										<th>{t('shared.user')}</th>
										<th>{t('shared.state')}</th>
										<th>{t('shared.submissionDate')}</th>
									</tr>
								</thead>
								<tbody>
									{applications.map((app) => {
										const state = app.application_state || app.state;
										return (
											<tr key={app.application_guid || app.applicationGuid}>
												<td>{app.badge?.badge_title || app.badge?.badgeTitle || '—'}</td>
												<td>{app.user?.user?.full_name || app.user?.fullName || '—'}</td>
												<td>
													<span className={`badge ${STATE_BADGE_CLASS[state] || 'bg-secondary'}`}>
														{state}
													</span>
												</td>
												<td className="text-muted">
													{app.submitted_at || app.submittedAt
														? new Date(app.submitted_at || app.submittedAt).toLocaleDateString('pt-PT')
														: '—'}
												</td>
											</tr>
										);
										})}
									</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
