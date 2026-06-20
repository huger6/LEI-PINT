import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchUsers as getUsers } from '../../../features/users/api/usersApi';
import { getBadgesCatalog } from '../../../features/badges/api/badgesApi';
import { getLearningPathsPaged } from '../../../features/badges/api/hierarchyApi';
import { getAnnouncements } from '../../../features/announcements/api/announcementsApi';
import { getSLAs } from '../../../features/slas/api/slasApi';
import DashboardSkeleton from '../../../components/Skeleton/DashboardSkeleton';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import { ADMIN } from '../../../routes/paths';
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
	const [stats, setStats] = useState({ users: 0, badges: 0, learningPaths: 0 });
	const [announcements, setAnnouncements] = useState([]);
	const [slas, setSlas] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const [users, badges, paths, anns, slaRes] = await Promise.all([
					getUsers({ limit: 1 }),
					getBadgesCatalog({ limit: 1 }),
					getLearningPathsPaged({ limit: 1 }),
					getAnnouncements({ limit: 4 }).catch(() => ({ data: [] })),
					getSLAs({ limit: 4 }).catch(() => ({ data: [] })),
				]);
				if (!active) return;
				setStats({
					users: users.pagination?.totalItems || 0,
					badges: badges.pagination?.totalItems || 0,
					learningPaths: paths.pagination?.totalItems || 0,
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
	];

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
											<span className={styles.annTitle}>{a.announcement_title}</span>
											<span className={styles.annMessage}>{a.announcement_message}</span>
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
