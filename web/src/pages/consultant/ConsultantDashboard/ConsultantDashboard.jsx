import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../../components/Button/Button';
import { useTranslation } from 'react-i18next';
import { CONSULTANT, SHARED } from '../../../routes/paths';
import WelcomeCard from '../../../components/WelcomeCard/WelcomeCard';
import Icon from '../../../components/Icons/Icons';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import styles from './ConsultantDashboard.module.css';

const STATE_BADGE_CLASS = {
	Open: 'bg-secondary',
	Submitted: 'bg-primary',
	'In validation': 'bg-warning text-dark',
	Accepted: 'bg-success',
	Rejected: 'bg-danger',
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
				const apps = await getApplications();
				const appList = Array.isArray(apps) ? apps : (apps.data || []);

				if (ignore) return;

				const total = appList.length;
				const open = appList.filter((a) => (a.application_state || a.state) === 'Open').length;
				const submitted = appList.filter((a) => (a.application_state || a.state) === 'Submitted').length;
				const accepted = appList.filter((a) => (a.application_state || a.state) === 'Accepted').length;

				setStats({ total, open, submitted, accepted });
				setRecentApps(appList.slice(0, 5));
			} catch (err) {
				console.error(err);
			}
		}

		load();
		return () => { ignore = true; };
	}, []);

	return (
		<div>
			<WelcomeCard />

			<div className="row g-4 mb-4 mt-2">
				{[
					{ key: 'totalApplications', value: stats.total, cls: '' },
					{ key: 'open', value: stats.open, cls: 'text-secondary' },
					{ key: 'submitted', value: stats.submitted, cls: 'text-primary' },
					{ key: 'completed', value: stats.accepted, cls: 'text-success' },
				].map((s) => (
					<div className="col-6 col-md-3" key={s.key}>
						<Link to={SHARED.APPLICATIONS} className={`card border-0 shadow-sm h-100 text-decoration-none ${styles.statCard}`}>
							<div className="card-body">
								<h6 className="text-muted mb-2">{t(`consultantDashboard.${s.key}`)}</h6>
								<h3 className={`mb-0 ${s.cls}`}>{s.value}</h3>
							</div>
						</Link>
					</div>
				))}
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
								<div className={styles.emptyState}>
									<Icon name="paper" size={36} className={styles.emptyIcon} aria-hidden="true" />
									<p className={styles.emptyTitle}>{t('consultantDashboard.noApplications')}</p>
									<p className={styles.emptyHint}>{t('consultantDashboard.noApplicationsHint')}</p>
									<Button as={Link} to={CONSULTANT.CATALOG} size="sm">
										<Icon name="search" size={14} className="me-1" aria-hidden="true" />
										{t('consultantDashboard.exploreCatalog')}
									</Button>
								</div>
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
