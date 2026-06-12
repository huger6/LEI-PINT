import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { useTranslation } from 'react-i18next';
import { CONSULTANT, SHARED } from '../../routes/paths';
import WelcomeCard from '../../components/WelcomeCard/WelcomeCard';
import Icon from '../../components/Icons/Icons';
import { getApplications } from '../../services/applicationService';
import styles from './ConsultantDashboard.module.css';

const STATE_BADGE_MAP = {
	Open: 'badge-open',
	Submitted: 'badge-submitted',
	'In validation': 'badge-validation',
	Accepted: 'badge-accepted',
	Rejected: 'badge-rejected',
};

export default function ConsultantDashboard() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [stats, setStats] = useState({ total: 0, open: 0, submitted: 0, accepted: 0 });
	const [recentApps, setRecentApps] = useState([]);

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
				const accepted = apps.filter((a) => (a.application_state || a.state) === 'Accepted').length;

				setStats({ total, open, submitted, accepted });
				setRecentApps(apps.slice(0, 5));
			} catch (err) {
				console.error(err);
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

			<div className="row g-4 mb-4 mt-2">
				<div className="col-md-3">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h6 className="text-muted mb-2">{t('consultantDashboard.totalApplications')}</h6>
							<h3 className="mb-0">{stats.total}</h3>
						</div>
					</div>
				</div>
				<div className="col-md-3">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h6 className="text-muted mb-2">{t('consultantDashboard.open')}</h6>
							<h3 className="mb-0 text-secondary">{stats.open}</h3>
						</div>
					</div>
				</div>
				<div className="col-md-3">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h6 className="text-muted mb-2">{t('consultantDashboard.submitted')}</h6>
							<h3 className="mb-0 text-primary">{stats.submitted}</h3>
						</div>
					</div>
				</div>
				<div className="col-md-3">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h6 className="text-muted mb-2">{t('consultantDashboard.completed')}</h6>
							<h3 className="mb-0 text-success">{stats.accepted}</h3>
						</div>
					</div>
				</div>
			</div>

			<div className="row g-4">
				<div className="col-lg-8">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<div className="d-flex justify-content-between align-items-center mb-3">
								<h5 className="fw-semibold mb-0">{t('consultantDashboard.recentApplications')}</h5>
								<Link to={SHARED.APPLICATIONS} className="small">{t('shared.viewAll')}</Link>
							</div>

							{recentApps.length === 0 ? (
								<p className="text-muted small mb-0">{t('consultantDashboard.noApplications')}</p>
							) : (
								<div className="table-responsive">
									<table className="table table-sm align-middle mb-0">
										<thead className="table-light">
											<tr>
												<th>{t('shared.badge')}</th>
												<th>{t('shared.state')}</th>
												<th>{t('shared.date')}</th>
											</tr>
										</thead>
										<tbody>
											{recentApps.map((app) => {
												const state = app.application_state || app.state;
												return (
													<tr
														key={app.application_guid || app.applicationGuid}
														className={styles.clickableRow}
														onClick={() => navigate(`${SHARED.APPLICATIONS}/${app.application_guid || app.applicationGuid}`)}
													>
														<td className="fw-medium">
															{app.badge?.badge_title || app.badge?.badgeTitle || '—'}
														</td>
														<td>
															<span className={`badge ${STATE_BADGE_CLASS[state] || 'bg-secondary'}`}>
																{state}
															</span>
														</td>
														<td className="text-muted small">
															{(() => {
																const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
																return dateStr ? new Date(dateStr).toLocaleDateString('pt-PT') : '—';
															})()}
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

				<div className="col-lg-4">
					<div className="card border-0 shadow-sm">
						<div className="card-body">
							<h5 className="fw-semibold mb-3">{t('shared.quickActions')}</h5>
							<div className="d-flex flex-column gap-2">
								<Button as={Link} to={CONSULTANT.CATALOG} variant="outlined" className="text-start">
									<Icon name="search" size={16} className="me-2" aria-hidden="true" />
									{t('consultantDashboard.exploreCatalog')}
								</Button>
								<Button as={Link} to={SHARED.APPLICATIONS} variant="outlined" className="text-start">
									<Icon name="paper" size={16} className="me-2" aria-hidden="true" />
									{t('consultantDashboard.myApplications')}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
