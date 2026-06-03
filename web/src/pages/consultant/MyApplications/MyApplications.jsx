import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import Icon from '../../../components/Icons/Icons';
import styles from './MyApplications.module.css';

const STATE_STYLE_MAP = {
	Open: 'stateOpen',
	Submitted: 'stateSubmitted',
	'In validation': 'stateInValidation',
	Accepted: 'stateAccepted',
	Rejected: 'stateRejected',
};

function SkeletonCards() {
	return (
		<div className={styles.skeletonGrid}>
			{[0, 1, 2, 3].map((i) => (
				<div key={i} className={styles.skeletonCard}>
					<div className={styles.skeletonRow}>
						<div className={styles.skeletonCircle} />
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
							<div className={`${styles.skeletonLine} ${styles.skeletonLineMed}`} />
							<div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
						</div>
					</div>
					<div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
				</div>
			))}
		</div>
	);
}

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

	const tabs = useMemo(() => [
		{ key: 'all', label: t('myApplications.tabs.all') },
		{ key: 'Open', label: t('myApplications.tabs.open') },
		{ key: 'Submitted', label: t('myApplications.tabs.submitted') },
		{ key: 'In validation', label: t('myApplications.tabs.inValidation') },
		{ key: 'Accepted', label: t('myApplications.tabs.accepted') },
		{ key: 'Rejected', label: t('myApplications.tabs.rejected') },
	], [t]);

	const stats = useMemo(() => {
		const total = applications.length;
		const open = applications.filter((a) => (a.application_state || a.state) === 'Open').length;
		const submitted = applications.filter((a) => (a.application_state || a.state) === 'Submitted').length;
		const accepted = applications.filter((a) => (a.application_state || a.state) === 'Accepted').length;
		const rejected = applications.filter((a) => (a.application_state || a.state) === 'Rejected').length;
		return { total, open, submitted, accepted, rejected };
	}, [applications]);

	const filtered = useMemo(() => {
		if (activeTab === 'all') return applications;
		return applications.filter((a) => (a.application_state || a.state) === activeTab);
	}, [applications, activeTab]);

	const statCards = [
		{ label: t('myApplications.stats.total'), value: stats.total },
		{ label: t('myApplications.stats.open'), value: stats.open },
		{ label: t('myApplications.stats.submitted'), value: stats.submitted },
		{ label: t('myApplications.stats.accepted'), value: stats.accepted },
	];

	function formatDate(app) {
		const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('pt-PT', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}

	function getStateLabel(state) {
		const map = {
			Open: t('myApplications.tabs.open'),
			Submitted: t('myApplications.tabs.submitted'),
			'In validation': t('myApplications.tabs.inValidation'),
			Accepted: t('myApplications.tabs.accepted'),
			Rejected: t('myApplications.tabs.rejected'),
		};
		return map[state] || state;
	}

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('myApplications.title')}</h1>

			{/* Stats Row */}
			<div className={styles.statsRow}>
				{statCards.map((s) => (
					<div key={s.label} className={styles.statCard}>
						<span className={styles.statValue}>{s.value}</span>
						<span className={styles.statLabel}>{s.label}</span>
					</div>
				))}
			</div>

			{/* Tab Bar */}
			<div className={styles.tabBar} role="tablist">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						role="tab"
						aria-selected={activeTab === tab.key}
						className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
						onClick={() => setActiveTab(tab.key)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{loading ? (
				<SkeletonCards />
			) : error ? (
				<div className={styles.errorCard}>
					{t('myApplications.errorLoading', { error })}
				</div>
			) : filtered.length === 0 ? (
				<div className={styles.emptyCard}>
					<h5 className={styles.emptyTitle}>{t('myApplications.noApplications')}</h5>
					<p className={styles.emptyDesc}>{t('myApplications.noApplicationsDesc')}</p>
				</div>
			) : (
				<div className={styles.cardsGrid}>
					{filtered.map((app) => {
						const state = app.application_state || app.state;
						const guid = app.application_guid || app.applicationGuid;
						const badgeName = app.badge?.badge_title || app.badge?.badgeTitle || `Badge #${app.badge_id || app.badgeId}`;
						const badgeImg = app.badge?.badge_img_url || app.badge?.badgeImgUrl;
						const areaName = app.badge?.area?.area_name || app.badge?.area?.areaName;
						const stateStyle = STATE_STYLE_MAP[state] || '';

						return (
							<div
								key={guid}
								className={styles.appCard}
								onClick={() => navigate(`/applications/${guid}`)}
							>
								<div className={styles.cardHeader}>
									<div className={styles.cardBadgeIcon}>
										{badgeImg ? (
											<img src={badgeImg} alt={badgeName} className={styles.cardBadgeImg} />
										) : (
											<Icon name="trophy" size={24} color="var(--color-secondary, #39639c)" />
										)}
									</div>
									<div className={styles.cardInfo}>
										<div className={styles.cardTitleRow}>
											<h3 className={styles.cardTitle}>{badgeName}</h3>
											<span className={`${styles.stateChip} ${styles[stateStyle]}`}>
												{getStateLabel(state)}
											</span>
										</div>
										<div className={styles.cardMeta}>
											{areaName && (
												<span className={styles.metaItem}>
													<Icon name="area" size={14} color="var(--color-outline, #70787c)" />
													{areaName}
												</span>
											)}
											<span className={styles.metaItem}>
												<Icon name="clock" size={14} color="var(--color-outline, #70787c)" />
												{formatDate(app)}
											</span>
										</div>
									</div>
								</div>

								<div className={styles.cardFooter}>
									<span className={styles.metaItem}>
										{state === 'Open' && t('myApplications.tabs.open')}
										{state === 'Submitted' && t('myApplications.tabs.submitted')}
										{state === 'In validation' && t('myApplications.tabs.inValidation')}
										{state === 'Accepted' && t('myApplications.tabs.accepted')}
										{state === 'Rejected' && t('myApplications.tabs.rejected')}
									</span>
									<button
										type="button"
										className={styles.viewBtn}
										onClick={(e) => {
											e.stopPropagation();
											navigate(`/applications/${guid}`);
										}}
									>
										{t('myApplications.viewDetails')}
										<Icon name="chevron_forward" size={14} color="var(--color-secondary, #39639c)" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
