import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { getRanking } from '../../../services/pointsService';
import WelcomeCard from '../../../components/WelcomeCard/WelcomeCard';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import styles from './ManagementDashboard.module.css';

// Shared dashboard for management roles (Talent Manager / Service Line Leader).
// The applications/ranking endpoints are scoped server-side by role.
const VALIDATIONS_PATH = '/validations';
const TOP_CONSULTANTS = 5;

const SUMMARY_CONFIG = [
	{ state: 'Submitted', icon: 'send', color: 'var(--color-purple-on-soft)', bg: 'var(--color-purple-soft)', labelKey: 'tmValidations.tabs.submitted' },
	{ state: 'In validation', icon: 'progress', color: 'var(--color-orange-on-soft)', bg: 'var(--color-orange-soft)', labelKey: 'tmValidations.tabs.inValidation' },
	{ state: 'Accepted', icon: 'check_circle', color: 'var(--color-green-on-soft)', bg: 'var(--color-green-soft)', labelKey: 'tmValidations.tabs.accepted' },
	{ state: 'Rejected', icon: 'close_circle', color: 'var(--color-red-on-soft)', bg: 'var(--color-red-soft)', labelKey: 'tmValidations.tabs.rejected' },
];

export default function ManagementDashboard() {
	const { t } = useTranslation();
	const [counts, setCounts] = useState(null);
	const [loading, setLoading] = useState(true);
	const [topConsultants, setTopConsultants] = useState([]);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const [results, ranking] = await Promise.all([
					Promise.all(
						SUMMARY_CONFIG.map((c) =>
							getApplicationsPaged({ state: c.state, page: 1, limit: 1 })
								.then((r) => r.pagination?.total ?? 0)
								.catch(() => 0)
						)
					),
					getRanking({ page: 1, limit: TOP_CONSULTANTS }).then((r) => r.rankings).catch(() => []),
				]);
				if (active) {
					setCounts(SUMMARY_CONFIG.reduce((acc, c, i) => ({ ...acc, [c.state]: results[i] }), {}));
					setTopConsultants(ranking);
				}
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	return (
		<div className={styles.page}>
			<WelcomeCard />

			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>{t('tmDashboard.summaryTitle')}</h2>
				<Link to={VALIDATIONS_PATH} className={styles.seeAll}>
					{t('tmDashboard.goToValidations')}
					<Icon name="chevron_forward" size={14} color="var(--color-secondary)" />
				</Link>
			</div>

			<div className={styles.statsRow}>
				{SUMMARY_CONFIG.map((c) => (
					<Link key={c.state} to={VALIDATIONS_PATH} className={styles.statCard}>
						<div className={styles.statIcon} style={{ background: c.bg }}>
							<Icon name={c.icon} size={20} color={c.color} />
						</div>
						<span className={styles.statValue}>{loading ? '—' : (counts?.[c.state] ?? 0)}</span>
						<span className={styles.statLabel}>{t(c.labelKey)}</span>
					</Link>
				))}
			</div>

			{/* Top consultants overview */}
			<ContentCard className={styles.topCard}>
				<div className={styles.topHeader}>
					<CardHeader icon="trophy" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('tmDashboard.topConsultants')} />
					<Link to={SHARED.RANKING} className={styles.seeAll}>
						{t('tmDashboard.seeRanking')}
						<Icon name="chevron_forward" size={14} color="var(--color-secondary)" />
					</Link>
				</div>

				{loading ? (
					<p className={styles.topEmpty}>—</p>
				) : topConsultants.length === 0 ? (
					<p className={styles.topEmpty}>{t('tmDashboard.noConsultants')}</p>
				) : (
					<ul className={styles.topList}>
						{topConsultants.map((entry, idx) => (
							<li key={entry.user_guid || idx} className={styles.topRow}>
								<span className={styles.topRank}>{idx + 1}</span>
								<Avatar src={entry.profile_img_url} name={entry.full_name} size={32} />
								<span className={styles.topName}>{entry.full_name}</span>
								<span className={styles.topMeta}>{entry.total_badges ?? 0} {t('tmDashboard.badgesShort')}</span>
								<span className={styles.topPoints}>{Number(entry.total_points ?? 0).toLocaleString('pt-PT')} pts</span>
							</li>
						))}
					</ul>
				)}
			</ContentCard>
		</div>
	);
}
