import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED, TM, SLL } from '../../../routes/paths';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { getRanking } from '../../../services/pointsService';
import {
	getConsultantsOverview,
	getExpiringBadges,
	getBadgesByServiceLine,
	getLevelDistribution,
} from '../../../features/statistics/api/statisticsApi';
import { useUser } from '../../../hooks/userContext';
import WelcomeCard from '../../../components/WelcomeCard/WelcomeCard';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import styles from './ManagementDashboard.module.css';

// Shared dashboard for management roles (Talent Manager / Service Line Leader).
// The applications/ranking/stats endpoints are scoped server-side by role.
const VALIDATIONS_PATH = '/validations';
const TOP_CONSULTANTS = 5;

export default function ManagementDashboard() {
	// Access translation function.
	const { t } = useTranslation();
	// Retrieve the current authenticated user.
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';

	// Store application counts grouped by workflow state.
	const [counts, setCounts] = useState(null);
	// Store the total number of consultants in scope.
	const [consultantsTotal, setConsultantsTotal] = useState(0);
	// Store the count of badges expiring within the next year.
	const [expiringCount, setExpiringCount] = useState(0);
	// Store badges awarded grouped by service line for the bar chart.
	const [bySl, setBySl] = useState([]);
	// Store badge counts grouped by progression level for the donut chart.
	const [levels, setLevels] = useState([]);
	// Store the top-ranked consultants for the leaderboard section.
	const [topConsultants, setTopConsultants] = useState([]);
	// Track whether the dashboard data is still loading.
	const [loading, setLoading] = useState(true);

	// Fetch all dashboard data in parallel on mount.
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const states = ['Submitted', 'In validation', 'Accepted', 'Rejected'];
				const [countResults, consultants, expiring, slData, levelData, ranking] = await Promise.all([
					Promise.all(states.map((s) =>
						getApplicationsPaged({ state: s, page: 1, limit: 1 }).then((r) => r.pagination?.total ?? 0).catch(() => 0)
					)),
					getConsultantsOverview({ page: 1, limit: 1 }).then((r) => r.pagination?.totalItems ?? 0).catch(() => 0),
					isSll ? Promise.resolve([]) : getExpiringBadges(365).catch(() => []),
					getBadgesByServiceLine().catch(() => []),
					getLevelDistribution().catch(() => []),
					getRanking({ page: 1, limit: TOP_CONSULTANTS }).then((r) => r.rankings).catch(() => []),
				]);
				if (!active) return;
				setCounts(states.reduce((acc, s, i) => ({ ...acc, [s]: countResults[i] }), {}));
				setConsultantsTotal(consultants);
				setExpiringCount(expiring.length);
				setBySl(slData);
				setLevels(levelData);
				setTopConsultants(ranking);
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, [isSll]);

	// Pending = the queue awaiting THIS role's action (TM: Submitted, SLL: In
	// validation). Matches the welcome card so the two counts never disagree.
	const pending = isSll ? (counts?.['In validation'] ?? 0) : (counts?.Submitted ?? 0);
	const accepted = counts?.Accepted ?? 0;
	const rejected = counts?.Rejected ?? 0;
	const approvalRate = accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : 0;
	const consultantsPath = isSll ? SLL.TEAM : TM.CONSULTANTS;

	const kpis = [
		{ key: 'pending', value: pending, icon: 'progress', bg: 'var(--color-orange-soft)', color: 'var(--color-orange-on-soft)', label: t('tmDashboard.kpiPending'), to: VALIDATIONS_PATH },
		{ key: 'consultants', value: consultantsTotal, icon: 'tabler_users', bg: 'var(--color-purple-soft)', color: 'var(--color-purple-on-soft)', label: t('tmDashboard.kpiConsultants'), to: consultantsPath },
		{ key: 'badges', value: accepted, icon: 'badge', bg: 'var(--color-green-soft)', color: 'var(--color-green-on-soft)', label: t('tmDashboard.kpiBadges'), to: TM.STATS },
		{ key: 'rate', value: `${approvalRate}%`, icon: 'check_circle', bg: 'var(--color-secondary-container)', color: 'var(--color-secondary)', label: t('tmDashboard.kpiApprovalRate'), to: TM.STATS },
		...(!isSll ? [{ key: 'expiring', value: expiringCount, icon: 'clock', bg: 'var(--color-red-soft)', color: 'var(--color-red-on-soft)', label: t('tmDashboard.kpiExpiring'), to: TM.STATS }] : []),
	];

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

			<div className={styles.kpiRow}>
				{kpis.map((k) => {
					const Inner = (
						<>
							<div className={styles.kpiIcon} style={{ background: k.bg }}>
								<Icon name={k.icon} size={20} color={k.color} />
							</div>
							<div className={styles.kpiBody}>
								<span className={styles.kpiValue}>{loading ? '—' : k.value}</span>
								<span className={styles.kpiLabel}>{k.label}</span>
							</div>
						</>
					);
					return k.to
						? <Link key={k.key} to={k.to} className={styles.kpiCard}>{Inner}</Link>
						: <div key={k.key} className={styles.kpiCard}>{Inner}</div>;
				})}
			</div>

			{/* Distribution charts */}
			<div className={styles.chartsGrid}>
				<ContentCard>
					<CardHeader icon="service-line" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('tmDashboard.chartByServiceLine')} />
					<div className={styles.chartBox}>
						{!loading && bySl.length > 0
							? <VerticalBarChart data={bySl} xAxisKey="service_line_name" yAxisKey="awarded_count" valueName={t('tmDashboard.badgesAwarded')} />
							: <p className={styles.chartEmpty}>{loading ? '—' : t('tmDashboard.noData')}</p>}
					</div>
				</ContentCard>
				<ContentCard>
					<CardHeader icon="badge" iconBg="var(--color-green-soft)" iconColor="var(--color-green-on-soft)" title={t('tmDashboard.chartByLevel')} />
					<div className={styles.chartBox}>
						{!loading && levels.length > 0
							? <PieDonutChart data={levels} nameKey="stage_code" valueKey="awarded_count" valueName={t('tmDashboard.badgesAwarded')} isDonut />
							: <p className={styles.chartEmpty}>{loading ? '—' : t('tmDashboard.noData')}</p>}
					</div>
				</ContentCard>
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
