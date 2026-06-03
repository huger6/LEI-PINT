import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ContentCard from '../../../components/ContentCard/ContentCard';
import { CardHeader } from '../../../components/ContentCard/ContentCard';
import Icon from '../../../components/Icons/Icons';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import ActivityHeatmap from '../../../components/Graphs/ActivityHeatmap/ActivityHeatmap';
import styles from './Points.module.css';

const MOCK_POINTS_SUMMARY = {
	total: 3750,
	weeklyGain: 125,
	percentile: 10,
	monthPoints: 480,
	monthChange: 12,
	weeklyAvg: 120,
	weeklyChange: 8,
	rankPosition: 14,
	totalConsultants: 142,
	motivationalMessage: 'points.motivational',
	motivationalHint: 'points.motivationalHint',
};

const MOCK_MILESTONES = [
	{ id: 1, name: 'Badge Especialista Cloud', current: 7, target: 10, percent: 70, color: 'var(--color-primary)' },
	{ id: 2, name: 'Certificação AWS Solutions Architect', current: 3, target: 5, percent: 60, color: 'var(--color-warning)' },
	{ id: 3, name: 'Nível Master Consultant', current: 3750, target: 5000, percent: 75, color: 'var(--color-error)' },
];

const MOCK_MONTHLY_DATA_RAW = [
	{ key: 'sep', points: 280 },
	{ key: 'oct', points: 320 },
	{ key: 'nov', points: 450 },
	{ key: 'dec', points: 380 },
	{ key: 'jan', points: 490 },
	{ key: 'feb', points: 520 },
];

const MOCK_WEEKLY_DATA_RAW = [
	{ key: 'mon', points: 25 },
	{ key: 'tue', points: 30 },
	{ key: 'wed', points: 28 },
	{ key: 'thu', points: 35 },
	{ key: 'fri', points: 42 },
	{ key: 'sat', points: 15 },
	{ key: 'sun', points: 10 },
];

const MOCK_HEATMAP = [
	3, 4, 2, 4, 3, 1, 0,
	2, 3, 4, 3, 2, 2, 0,
	4, 3, 3, 4, 4, 1, 1,
	3, 2, 4, 3, 3, 2, 0,
];

const MOCK_RECOMMENDATIONS = [
	{
		id: 1,
		name: 'IBM Cloud Kubernetes Service',
		tag: 'points.recommended',
		description: 'points.recommendDesc1',
		hours: 4,
		level: 'points.intermediate',
		pointsValue: 90,
	},
	{
		id: 2,
		name: 'Terraform Associate',
		description: 'points.recommendDesc2',
		hours: 6,
		level: 'points.intermediate',
		pointsValue: 85,
	},
	{
		id: 3,
		name: 'IBM watsonx.ai Essentials',
		description: 'points.recommendDesc3',
		hours: 3,
		level: 'points.basic',
		pointsValue: 70,
	},
];

const MOCK_ACHIEVEMENTS = [
	{ id: 1, name: 'AWS Solutions Architect – Associate', type: 'points.paidCert', date: '15 Jan 2026', bonus: 200 },
	{ id: 2, name: 'Red Hat Certified System Administrator', type: 'points.paidCert', date: '20 Nov 2025', bonus: 250 },
	{ id: 3, name: 'IBM Cloud Professional Architect', type: 'points.paidCert', date: '05 Set 2025', bonus: 300 },
];

const MOCK_HISTORY = [
	{ id: 1, date: '08 Mar 2026', badge: 'IBM Cloud Pak for Data', validator: 'Ana Silva - Talent Manager', serviceLine: 'Hybrid Cloud', area: 'OutSystems', points: 75, status: 'verified' },
	{ id: 2, date: '03 Mar 2026', badge: 'Red Hat OpenShift Administration', validator: 'Ana Silva - Talent Manager', serviceLine: 'Hybrid Cloud', area: 'Power Platform', points: 100, status: 'verified' },
	{ id: 3, date: '28 Fev 2026', badge: 'Agile Scrum Foundation', validator: 'Carlos Ferreira - Talent Manager', serviceLine: 'Metodologias', area: 'Python/ML', points: 50, status: 'verified' },
	{ id: 4, date: '22 Fev 2026', badge: 'Power Platform App Maker', validator: '', serviceLine: 'HybridCloud', area: 'Azure', points: 60, status: 'pending' },
	{ id: 5, date: '15 Fev 2026', badge: 'AWS Cloud Practitioner', validator: 'Ana Silva - Talent Manager', serviceLine: 'Cloud', area: 'Cloud', points: 80, status: 'verified' },
	{ id: 6, date: '10 Fev 2026', badge: 'Docker Essentials', validator: '', serviceLine: 'DevOps', area: 'DevSecOps', points: 45, status: 'expired' },
	{ id: 7, date: '01 Fev 2026', badge: 'Kubernetes Fundamentals', validator: 'Carlos Ferreira - Talent Manager', serviceLine: 'DevOps', area: 'DevSecOps', points: 65, status: 'verified' },
	{ id: 8, date: '25 Jan 2026', badge: 'IBM Garage Methodology', validator: 'Ana Silva - Talent Manager', serviceLine: 'Metodologias', area: 'Python ML', points: 55, status: 'verified' },
];

const PAGE_SIZE = 8;

export default function Points() {
	const { t } = useTranslation();
	const [historySearch, setHistorySearch] = useState('');
	const [currentPage, setCurrentPage] = useState(1);

	const monthlyData = useMemo(() =>
		MOCK_MONTHLY_DATA_RAW.map(d => ({ month: t(`shared.months.${d.key}`), points: d.points })),
		[t]
	);
	const weeklyData = useMemo(() =>
		MOCK_WEEKLY_DATA_RAW.map(d => ({ day: t(`shared.days.${d.key}`), points: d.points })),
		[t]
	);

	const summary = MOCK_POINTS_SUMMARY;
	const milestones = MOCK_MILESTONES;
	const recommendations = MOCK_RECOMMENDATIONS;
	const achievements = MOCK_ACHIEVEMENTS;
	const totalAchievementBonus = achievements.reduce((sum, a) => sum + a.bonus, 0);

	const filteredHistory = useMemo(() => {
		if (!historySearch.trim()) return MOCK_HISTORY;
		const q = historySearch.toLowerCase();
		return MOCK_HISTORY.filter(h =>
			h.badge.toLowerCase().includes(q) ||
			h.serviceLine.toLowerCase().includes(q) ||
			h.area.toLowerCase().includes(q)
		);
	}, [historySearch]);

	const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);
	const paginatedHistory = filteredHistory.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE
	);

	const milestoneIcons = ['badge', 'certificate', 'spark'];

	return (
		<div className={styles.page}>
			{/* ═══ ROW 1: Hero Points + Progress Milestones ═══ */}
			<div className="row g-3 mb-4">
				<div className="col-12 col-lg-7">
					<ContentCard className={styles.heroCard}>
						<div className={styles.heroTop}>
							<div className={styles.heroLeft}>
								<span className={styles.heroLabel}>{t('points.totalBalance')}</span>
								<div className={styles.heroValueRow}>
									<span className={styles.heroValue}>
										{summary.total.toLocaleString('pt-PT')}
									</span>
									<span className={styles.heroBadgeGreen}>
										<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
										+{summary.weeklyGain} {t('points.thisWeek')}
									</span>
								</div>
							</div>
							<div className={styles.rankBadge}>
								<Icon name="star-points" size={30} color="var(--color-orange-on-soft)" />
								<span className={styles.rankBadgeValue}>Top {summary.percentile}%</span>
								<span className={styles.rankBadgeSub}>{t('points.consultant')}</span>
							</div>
						</div>

						<div className={styles.motivationalBanner}>
							<div className={styles.motivationalIcon}>
								<Icon name="star-points" size={16} color="var(--color-secondary)" />
							</div>
							<div className={styles.motivationalText}>
								<p className={styles.motivationalMain}>{t('points.motivational', { gain: summary.weeklyGain, percent: 89 })}</p>
								<p className={styles.motivationalHint}>{t('points.motivationalHint')}</p>
							</div>
						</div>

						<div className={styles.miniStats}>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.thisMonth')}</span>
									<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>{summary.monthPoints}</span>
								<span className={styles.miniStatChange}>
									+{summary.monthChange}% {t('points.vsLastMonth')}
								</span>
							</div>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.weeklyAvg')}</span>
									<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>{summary.weeklyAvg}</span>
								<span className={styles.miniStatChange}>
									+{summary.weeklyChange}% {t('points.vsLastWeek')}
								</span>
							</div>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.rankPosition')}</span>
									<Icon name="trophy" size={14} color="var(--color-orange-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>#{summary.rankPosition}</span>
								<span className={styles.miniStatSub}>
									{t('points.outOf', { total: summary.totalConsultants })}
								</span>
							</div>
						</div>
					</ContentCard>
				</div>

				<div className="col-12 col-lg-5">
					<ContentCard className={styles.milestonesCard}>
						<div className={styles.milestonesHeader}>
							<CardHeader
								icon="target"
								iconBg="var(--color-primary-soft)"
								iconColor="var(--color-primary)"
								title={t('points.progressMilestones')}
							/>
							<button className={styles.viewAllBtn}>{t('points.viewAll')}</button>
						</div>
						<div className={styles.milestonesList}>
							{milestones.map((m, i) => (
								<div key={m.id} className={styles.milestoneItem}>
									<div className={styles.milestoneIcon}>
										<Icon name={milestoneIcons[i] || 'badge'} size={18} color={m.color} />
									</div>
									<div className={styles.milestoneInfo}>
										<div className={styles.milestoneTop}>
											<span className={styles.milestoneName}>{m.name}</span>
											<span className={styles.milestoneCounter}>
												{typeof m.current === 'number' && m.current > 99
													? m.current.toLocaleString('pt-PT')
													: m.current}/{typeof m.target === 'number' && m.target > 99
													? m.target.toLocaleString('pt-PT')
													: m.target}
											</span>
										</div>
										<div className={styles.progressBarBg}>
											<div
												className={styles.progressBarFill}
												style={{ width: `${m.percent}%`, background: m.color }}
											/>
										</div>
										<span className={styles.milestonePercent}>{m.percent}% {t('points.complete')}</span>
									</div>
								</div>
							))}
						</div>
					</ContentCard>
				</div>
			</div>

			{/* ═══ ROW 2: Charts — Pontos por Mês + Atividade Semanal ═══ */}
			<h6 className={styles.sectionTitle}>{t('points.metricsTitle')}</h6>
			<div className="row g-3 mb-4">
				<div className="col-12 col-lg-6">
					<ContentCard>
						<div className={styles.chartHeader}>
							<span className={styles.chartTitle}>{t('points.pointsByMonth')}</span>
						</div>
						<VerticalBarChart
							data={monthlyData}
							xAxisKey="month"
							yAxisKey="points"
							height={250}
						/>
					</ContentCard>
				</div>
				<div className="col-12 col-lg-6">
					<ContentCard>
						<div className={styles.chartHeader}>
							<span className={styles.chartTitle}>{t('points.weeklyActivity')}</span>
							<span className={styles.chartSubtitle}>{t('points.thisWeekLabel')}</span>
						</div>
						<LineAreaChart
							data={weeklyData}
							xAxisKey="day"
							yAxisKey="points"
							height={180}
						/>
						<div className={styles.heatmapSection}>
							<ActivityHeatmap
								data={MOCK_HEATMAP}
								weeks={4}
								title={t('points.heatmapTitle')}
							/>
						</div>
					</ContentCard>
				</div>
			</div>

			{/* ═══ ROW 3: Recommendations + Special Achievements ═══ */}
			<div className="row g-3 mb-4">
				<div className="col-12 col-lg-6">
					<ContentCard>
						<div className={styles.chartHeader}>
							<CardHeader
								icon="target"
								iconBg="var(--color-green-soft)"
								iconColor="var(--color-green-on-soft)"
								title={t('points.nextRecommended')}
							/>
							<span className={styles.chartSubtitle}>{t('points.recommendationSystem')}</span>
						</div>
						<div className={styles.recommendList}>
							{recommendations.map(r => (
								<div key={r.id} className={styles.recommendItem}>
									<div className={styles.recommendIcon}>
										<Icon name="badge" size={18} color="var(--color-secondary)" />
									</div>
									<div className={styles.recommendInfo}>
										<div className={styles.recommendNameRow}>
											<span className={styles.recommendName}>{r.name}</span>
											{r.tag && (
												<span className={styles.recommendTag}>{t(r.tag)}</span>
											)}
										</div>
										<p className={styles.recommendDesc}>{t(r.description)}</p>
										<div className={styles.recommendMeta}>
											<span><Icon name="clock" size={12} color="var(--color-outline)" /> ~{r.hours} {t('points.hours')}</span>
											<span><Icon name="evolution" size={12} color="var(--color-outline)" /> {t(r.level)}</span>
										</div>
									</div>
									<div className={styles.recommendPoints}>
										<span className={styles.recommendPointsValue}>+{r.pointsValue}</span>
										<span className={styles.recommendPointsLabel}>{t('points.pts')}</span>
									</div>
									<Icon name="progress" size={16} color="var(--color-outline)" />
								</div>
							))}
						</div>
					</ContentCard>
				</div>
				<div className="col-12 col-lg-6">
					<ContentCard>
						<CardHeader
							icon="trophy"
							iconBg="var(--color-orange-soft)"
							iconColor="var(--color-orange-on-soft)"
							title={t('points.specialAchievements')}
						/>
						<div className={styles.achievementsList}>
							{achievements.map(a => (
								<div key={a.id} className={styles.achievementItem}>
									<div className={styles.achievementLeft}>
										<Icon name="certificate" size={16} color="var(--color-secondary)" />
										<div className={styles.achievementInfo}>
											<span className={styles.achievementName}>{a.name}</span>
											<div className={styles.achievementMeta}>
												<span className={styles.achievementType}>{t(a.type)}</span>
												<span className={styles.achievementDate}>{a.date}</span>
											</div>
										</div>
									</div>
									<span className={styles.achievementBonus}>+{a.bonus} pts</span>
								</div>
							))}
						</div>
						<div className={styles.achievementsTotal}>
							<span>{t('points.totalCertBonus')}</span>
							<span className={styles.achievementsTotalValue}>{totalAchievementBonus} pts</span>
						</div>
					</ContentCard>
				</div>
			</div>

			{/* ═══ ROW 4: Points History Table ═══ */}
			<ContentCard padding={0}>
				<div className={styles.historyHeader}>
					<h6 className={styles.historyTitle}>{t('points.history')}</h6>
					<div className={styles.historyActions}>
						<div className={styles.historySearch}>
							<Icon name="search" size={16} color="var(--color-outline)" />
							<input
								type="text"
								placeholder={t('points.searchBadges')}
								value={historySearch}
								onChange={e => { setHistorySearch(e.target.value); setCurrentPage(1); }}
								className={styles.historySearchInput}
							/>
						</div>
						<button className={styles.historyBtn}>
							<Icon name="filter" size={14} color="var(--color-secondary)" />
							{t('points.filter')}
						</button>
						<button className={styles.historyBtn}>
							<Icon name="download" size={14} color="var(--color-secondary)" />
							{t('points.export')}
						</button>
					</div>
				</div>
				<div className={styles.tableWrapper}>
					<table className={styles.historyTable}>
						<thead>
							<tr>
								<th>{t('points.date')}</th>
								<th>{t('points.badgeRequirement')}</th>
								<th>{t('points.serviceLine')}</th>
								<th>{t('points.area')}</th>
								<th>{t('points.pointsCol')}</th>
								<th>{t('points.status')}</th>
							</tr>
						</thead>
						<tbody>
							{paginatedHistory.map(row => (
								<tr key={row.id}>
									<td className={styles.cellDate}>{row.date}</td>
									<td>
										<div className={styles.cellBadge}>
											<span className={styles.cellBadgeName}>{row.badge}</span>
											{row.validator && (
												<span className={styles.cellBadgeValidator}>{row.validator}</span>
											)}
										</div>
									</td>
									<td><span className={styles.cellPill}>{row.serviceLine}</span></td>
									<td><span className={styles.cellPill}>{row.area}</span></td>
									<td className={styles.cellPoints}>+{row.points}</td>
									<td>
										<span className={`${styles.statusBadge} ${styles[`status_${row.status}`]}`}>
											{t(`points.statusType.${row.status}`)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className={styles.pagination}>
					<span className={styles.paginationInfo}>
						{t('points.showing', {
							count: paginatedHistory.length,
							total: filteredHistory.length,
						})}
					</span>
					<div className={styles.paginationBtns}>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
							<button
								key={p}
								className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
								onClick={() => setCurrentPage(p)}
							>
								{p}
							</button>
						))}
					</div>
				</div>
			</ContentCard>
		</div>
	);
}
