import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../../../features/applications/api/applicationsApi';
import { useNotificationEvent } from '../../../features/notifications/hooks/useNotificationEvent';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Icon from '../../../components/Icons/Icons';
import styles from './MyApplications.module.css';

const STATE_STYLE_MAP = {
	Open: 'stateOpen',
	Submitted: 'stateSubmitted',
	'In validation': 'stateInValidation',
	Accepted: 'stateAccepted',
	Rejected: 'stateRejected',
};

const STATE_COLOR_MAP = {
	Open: 'var(--color-blue-on-soft, #1e3a5f)',
	Submitted: 'var(--color-purple-on-soft, #6b21a8)',
	'In validation': 'var(--color-orange-on-soft, #f39c12)',
	Accepted: 'var(--color-green-on-soft, #007a55)',
	Rejected: 'var(--color-red-on-soft, #dc2626)',
};

// Renders placeholder loading cards while applications are being fetched
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

// Consultant page listing all their badge applications with stats and tab filtering
export default function MyApplications() {
	// Translation helper for i18n labels
	const { t } = useTranslation();
	// Programmatic navigation to application detail pages
	const navigate = useNavigate();
	// Holds the fetched list of applications
	const [applications, setApplications] = useState([]);
	// Tracks whether applications are still loading
	const [loading, setLoading] = useState(true);
	// Stores any error message from the fetch
	const [error, setError] = useState(null);
	// Currently selected state filter tab
	const [activeTab, setActiveTab] = useState('all');

	// Fetch applications once on mount
	useEffect(() => {
		loadApplications();
	}, []);

	// Real-time: refresh the list the moment a validation step changes one of the
	// consultant's applications (e.g. Submitted → In validation → Accepted/Rejected),
	// so the status is never stale without a manual reload.
	useNotificationEvent('APPLICATIONS', () => loadApplications());

	// Loads the consultant's applications from the API
	async function loadApplications() {
		try {
			const data = await getApplications();
			setApplications(data.data || data || []);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	// Builds the localized tab definitions for each application state
	const tabs = useMemo(() => [
		{ key: 'all', label: t('myApplications.tabs.all') },
		{ key: 'Open', label: t('myApplications.tabs.open') },
		{ key: 'Submitted', label: t('myApplications.tabs.submitted') },
		{ key: 'In validation', label: t('myApplications.tabs.inValidation') },
		{ key: 'Accepted', label: t('myApplications.tabs.accepted') },
		{ key: 'Rejected', label: t('myApplications.tabs.rejected') },
	], [t]);

	// Computes per-state counts shown in the stat cards
	const stats = useMemo(() => {
		const total = applications.length;
		const open = applications.filter((a) => (a.application_state || a.state) === 'Open').length;
		const submitted = applications.filter((a) => (a.application_state || a.state) === 'Submitted').length;
		const accepted = applications.filter((a) => (a.application_state || a.state) === 'Accepted').length;
		const rejected = applications.filter((a) => (a.application_state || a.state) === 'Rejected').length;
		return { total, open, submitted, accepted, rejected };
	}, [applications]);

	// Filters applications by the active tab's state
	const filtered = useMemo(() => {
		if (activeTab === 'all') return applications;
		return applications.filter((a) => (a.application_state || a.state) === activeTab);
	}, [applications, activeTab]);

	const statCards = [
		{ label: t('myApplications.stats.total'), value: stats.total, icon: 'badge', color: 'var(--color-secondary, #39639c)', bg: 'var(--color-secondary-container, #cee8f1)' },
		{ label: t('myApplications.stats.open'), value: stats.open, icon: 'paper', color: 'var(--color-blue-on-soft, #1e3a5f)', bg: 'var(--color-blue-soft, #eff6ff)' },
		{ label: t('myApplications.stats.submitted'), value: stats.submitted, icon: 'send', color: 'var(--color-purple-on-soft, #6b21a8)', bg: 'var(--color-purple-soft, #f3eeff)' },
		{ label: t('myApplications.stats.accepted'), value: stats.accepted, icon: 'check_circle', color: 'var(--color-green-on-soft, #007a55)', bg: 'var(--color-green-soft, #ecfdf5)' },
	];

	// Formats an application's relevant date into a localized string
	function formatDate(app) {
		const dateStr = app.submitted_at || app.submittedAt || app.opened_at || app.createdAt;
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('pt-PT', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}

	// Maps an application state to its localized display label
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
						<div className={styles.statIconRow}>
							<div className={styles.statIcon} style={{ background: s.bg }}>
								<Icon name={s.icon} size={20} color={s.color} />
							</div>
							<span className={styles.statValue}>{s.value}</span>
						</div>
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
					{error}
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

						const cardStateClass = stateStyle ? styles[`card${stateStyle.charAt(0).toUpperCase()}${stateStyle.slice(1)}`] : '';

						return (
							<div
								key={guid}
								className={`${styles.appCard} ${cardStateClass || ''}`}
								onClick={() => navigate(`/applications/${guid}`)}
							>
								<div className={styles.cardHeader}>
									<div className={styles.cardBadgeIcon}>
										{badgeImg ? (
											<img src={badgeImg} alt={badgeName} className={styles.cardBadgeImg} />
										) : (
											<Icon name="paper" size={24} color="var(--color-secondary, #39639c)" />
										)}
									</div>
									<div className={styles.cardInfo}>
										<div className={styles.cardTitleRow}>
											<h3 className={styles.cardTitle}>{badgeName}</h3>
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
									<span
										className={styles.footerState}
										style={{ color: STATE_COLOR_MAP[state] }}
									>
										{getStateLabel(state)}
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
