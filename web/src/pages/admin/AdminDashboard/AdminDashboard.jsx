import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchUsers as getUsers } from '../../../features/users/api/usersApi';
import { getBadgesCatalog } from '../../../features/badges/api/badgesApi';
import { getLearningPathsPaged } from '../../../features/badges/api/hierarchyApi';
import { getServiceLinesCount, getAreasCount } from '../../../features/structure/api/structureCountsApi';
import { getApplicationsByState } from '../../../features/statistics/api/statisticsApi';
import { getAnnouncements } from '../../../features/announcements/api/announcementsApi';
import { getSLAs } from '../../../features/slas/api/slasApi';
import DashboardSkeleton from '../../../components/Skeleton/DashboardSkeleton';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import { ADMIN } from '../../../routes/paths';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './AdminDashboard.module.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');

function slaStatus(sla) {
	const now = Date.now();
	const end = sla.end_date ? new Date(sla.end_date).getTime() : null;
	if (end && end < now) return { key: 'expired', cls: styles.expired };
	if (end && end - now < 30 * 86400000) return { key: 'expiring', cls: styles.expiring };
	return { key: 'active', cls: styles.active };
}

export default function AdminDashboard() {
	const { t } = useTranslation();
	const [stats, setStats] = useState({ users: 0, badges: 0, learningPaths: 0, serviceLines: 0, areas: 0, applications: 0 });
	const [byState, setByState] = useState([]);
	const [announcements, setAnnouncements] = useState([]);
	const [slas, setSlas] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const [users, badges, paths, slCount, areaCount, states, anns, slaRes] = await Promise.all([
					getUsers({ limit: 1 }),
					getBadgesCatalog({ limit: 1 }),
					getLearningPathsPaged({ limit: 1 }),
					getServiceLinesCount().catch(() => ({ active: 0, inactive: 0 })),
					getAreasCount().catch(() => ({ active: 0, inactive: 0 })),
					getApplicationsByState().catch(() => []),
					getAnnouncements({ limit: 4 }).catch(() => ({ data: [] })),
					getSLAs({ limit: 4 }).catch(() => ({ data: [] })),
				]);
				if (!active) return;
				const stateRows = (states || []).map((s) => ({
					state: s.state || s.application_state,
					count: Number(s.count ?? s.total ?? 0),
				}));
				setByState(stateRows);
				setStats({
					users: users.pagination?.totalItems || 0,
					badges: badges.pagination?.totalItems || 0,
					learningPaths: paths.pagination?.totalItems || 0,
					serviceLines: (slCount.active || 0) + (slCount.inactive || 0),
					areas: (areaCount.active || 0) + (areaCount.inactive || 0),
					applications: stateRows.reduce((sum, r) => sum + r.count, 0),
				});
				setAnnouncements(anns.data || []);
				setSlas(slaRes.data || []);
			} catch (err) {
				console.error(err);
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	const kpis = [
		{ key: 'users', value: stats.users, icon: 'tabler_users', label: t('adminDashboard.users'), link: ADMIN.USERS },
		{ key: 'badges', value: stats.badges, icon: 'badge', label: t('adminDashboard.badges'), link: ADMIN.BADGES },
		{ key: 'paths', value: stats.learningPaths, icon: 'learning-path', label: t('adminDashboard.learningPaths'), link: ADMIN.STRUCTURE },
		{ key: 'serviceLines', value: stats.serviceLines, icon: 'service-line', label: t('adminDashboard.serviceLines'), link: ADMIN.STRUCTURE },
		{ key: 'areas', value: stats.areas, icon: 'area', label: t('adminDashboard.areas'), link: ADMIN.STRUCTURE },
		{ key: 'applications', value: stats.applications, icon: 'paper', label: t('adminDashboard.applications'), link: ADMIN.APPLICATIONS },
	];

	const STATE_KEY = { 'Open': 'open', 'Submitted': 'submitted', 'In validation': 'inValidation', 'Accepted': 'accepted', 'Rejected': 'rejected' };

	if (loading) return <DashboardSkeleton />;

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<span className={styles.eyebrow}>ADMIN</span>
				<h1 className={styles.title}>{t('adminDashboard.title')}</h1>
			</div>

			<div className={styles.kpiRow}>
				{kpis.map((k) => (
					<Link key={k.key} to={k.link} className={styles.kpiCard}>
						<Icon name={k.icon} size={26} color="var(--color-secondary)" aria-hidden="true" />
						<span className={styles.kpiValue}>{Number(k.value).toLocaleString('pt-PT')}</span>
						<span className={styles.kpiLabel}>{k.label}</span>
					</Link>
				))}
			</div>

			{byState.length > 0 && (
				<section className={styles.statesPanel}>
					<div className={styles.panelHead}>
						<Icon name="progress" size={20} color="var(--color-secondary)" aria-hidden="true" />
						<h2 className={styles.panelTitle}>{t('adminDashboard.applicationsByState')}</h2>
						<Link to={ADMIN.STATS} className={styles.statesLink}>{t('shared.viewAll')}</Link>
					</div>
					<div className={styles.statesGrid}>
						{byState.map((s) => (
							<div key={s.state} className={`${styles.stateCard} ${styles[`state_${STATE_KEY[s.state] || 'open'}`]}`}>
								<span className={styles.stateCount}>{s.count}</span>
								<span className={styles.stateLabel}>{t(`applicationReview.appState.${STATE_KEY[s.state] || 'open'}`, { defaultValue: s.state })}</span>
							</div>
						))}
					</div>
				</section>
			)}

			<div className={styles.panels}>
				{/* Announcements */}
				<section className={styles.panel}>
					<div className={styles.panelHead}>
						<Icon name="megaphone" size={20} color="var(--color-secondary)" aria-hidden="true" />
						<h2 className={styles.panelTitle}>{t('adminDashboard.announcements')}</h2>
					</div>
					<div className={styles.panelBody}>
						{announcements.length === 0 ? (
							<p className={styles.empty}>{t('adminDashboard.noAnnouncements')}</p>
						) : (
							<ul className={styles.list}>
								{announcements.map((a) => (
									<li key={a.announcement_id} className={styles.annItem}>
										<div className={styles.annText}>
											<span className={styles.annTitle}><TranslatedText text={a.announcement_title} /></span>
											<span className={styles.annMessage}><TranslatedText text={a.announcement_message} /></span>
										</div>
										<span className={styles.annDate}>{fmtDate(a.starts_at || a.created_at)}</span>
									</li>
								))}
							</ul>
						)}
					</div>
					<Button as={Link} to={ADMIN.ANNOUNCEMENTS} className={styles.panelBtn}>
						<Icon name="add" size={16} className="me-1" aria-hidden="true" />
						{t('adminDashboard.createAnnouncement')}
					</Button>
				</section>

				{/* SLAs */}
				<section className={styles.panel}>
					<div className={styles.panelHead}>
						<Icon name="time" size={20} color="var(--color-secondary)" aria-hidden="true" />
						<h2 className={styles.panelTitle}>{t('adminDashboard.slas')}</h2>
					</div>
					<div className={styles.panelBody}>
						{slas.length === 0 ? (
							<p className={styles.empty}>{t('adminDashboard.noSlas')}</p>
						) : (
							<ul className={styles.list}>
								{slas.map((s) => {
									const st = slaStatus(s);
									return (
										<li key={s.sla_id} className={styles.slaItem}>
											<div className={styles.slaTop}>
												<span className={styles.slaName}>{s.sla_name}</span>
												<span className={`${styles.slaChip} ${st.cls}`}>{t(`adminDashboard.slaStatus.${st.key}`)}</span>
											</div>
											<span className={styles.slaDates}>
												{t('adminDashboard.slaStart')}: {fmtDate(s.start_date)} · {t('adminDashboard.slaEnd')}: {fmtDate(s.end_date)}
											</span>
										</li>
									);
								})}
							</ul>
						)}
					</div>
					<Button as={Link} to={ADMIN.SLAS} className={styles.panelBtn}>
						<Icon name="add" size={16} className="me-1" aria-hidden="true" />
						{t('adminDashboard.createSla')}
					</Button>
				</section>
			</div>
		</div>
	);
}
