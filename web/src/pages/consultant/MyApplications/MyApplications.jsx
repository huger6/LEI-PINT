import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button/Button';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Icon from '../../../components/Icons/Icons';
import styles from './MyApplications.module.css';

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
	const { t } = useTranslation();
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

	if (loading) {
		return (
			<>
				<h1 className="h3 mb-4">{t('myApplications.title')}</h1>
				<div className="card border-0 shadow-sm">
					<div className="card-body p-0">
						<TableSkeleton rows={5} columns={4} />
					</div>
				</div>
			</>
		);
	}

	if (error) {
		return (
			<div className="alert alert-danger m-4" role="alert">
				{t('myApplications.errorLoading', { error })}
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
			<h1 className="h3 mb-4">{t('myApplications.title')}</h1>

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
												<Button
													size="sm"
													variant="outlined"
													title={t('myApplications.viewDetails')}
													onClick={(e) => {
														e.stopPropagation();
														navigate(`/applications/${app.application_guid || app.applicationGuid}`);
													}}
												>
													<Icon
														name="keyboard_arrow_down"
														size={16}
														aria-hidden="true"
														style={{ transform: 'rotate(-90deg)' }}
													/>
												</Button>
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
