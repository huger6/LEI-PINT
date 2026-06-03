import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ContentCard from '../../../components/ContentCard/ContentCard';
import { CardHeader } from '../../../components/ContentCard/ContentCard';
import Icon from '../../../components/Icons/Icons';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import ActivityHeatmap from '../../../components/Graphs/ActivityHeatmap/ActivityHeatmap';
import Skeleton from '../../../components/Skeleton/Skeleton';
import {
	getConsultantStats,
	getPointsHistory,
	getPointsHistoryAll,
	getEarnedBadges,
	getRecommendations,
	getLearningPathProgress,
	getRanking,
} from '../../../services/pointsService';
import styles from './Points.module.css';

const PAGE_SIZE = 8;
const LP_PROGRESS_COLORS = [
	'var(--color-primary)',
	'var(--color-warning)',
	'var(--color-error)',
	'var(--color-secondary)',
	'var(--color-success)',
];

function aggregateByMonth(history) {
	const map = {};
	const now = new Date();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		map[key] = { key, points: 0, date: d };
	}
	for (const entry of history) {
		const d = new Date(entry.created_at);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		if (map[key]) map[key].points += entry.points_delta;
	}
	return Object.values(map);
}

function aggregateByDayOfWeek(history) {
	const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	const now = new Date();
	const startOfWeek = new Date(now);
	const dayOfWeek = now.getDay();
	const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	startOfWeek.setDate(now.getDate() - diff);
	startOfWeek.setHours(0, 0, 0, 0);

	const result = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
	for (const entry of history) {
		const d = new Date(entry.created_at);
		if (d >= startOfWeek) {
			const k = dayKeys[d.getDay()];
			result[k] += entry.points_delta;
		}
	}
	return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(key => ({
		key,
		points: result[key],
	}));
}

function buildHeatmap(history) {
	const now = new Date();
	const cells = new Array(28).fill(0);
	const startDate = new Date(now);
	startDate.setDate(now.getDate() - 27);
	startDate.setHours(0, 0, 0, 0);

	for (const entry of history) {
		const d = new Date(entry.created_at);
		if (d >= startDate) {
			const dayDiff = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
			if (dayDiff >= 0 && dayDiff < 28) cells[dayDiff] += entry.points_delta;
		}
	}

	const max = Math.max(...cells, 1);
	return cells.map(v => {
		if (v === 0) return 0;
		const ratio = v / max;
		if (ratio <= 0.25) return 1;
		if (ratio <= 0.5) return 2;
		if (ratio <= 0.75) return 3;
		return 4;
	});
}

function computeWeekOverWeek(history) {
	const now = new Date();
	const thisWeekStart = new Date(now);
	const dayOfWeek = now.getDay();
	const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	thisWeekStart.setDate(now.getDate() - diff);
	thisWeekStart.setHours(0, 0, 0, 0);

	const lastWeekStart = new Date(thisWeekStart);
	lastWeekStart.setDate(lastWeekStart.getDate() - 7);

	let thisWeek = 0, lastWeek = 0;
	for (const entry of history) {
		const d = new Date(entry.created_at);
		if (d >= thisWeekStart) thisWeek += entry.points_delta;
		else if (d >= lastWeekStart) lastWeek += entry.points_delta;
	}
	return { thisWeek, lastWeek, change: lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0 };
}

function computeMonthOverMonth(history) {
	const now = new Date();
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

	let thisMonth = 0, lastMonth = 0;
	for (const entry of history) {
		const d = new Date(entry.created_at);
		if (d >= thisMonthStart) thisMonth += entry.points_delta;
		else if (d >= lastMonthStart) lastMonth += entry.points_delta;
	}
	return { thisMonth, lastMonth, change: lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0 };
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function Points() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);
	const [allHistory, setAllHistory] = useState([]);
	const [totalConsultants, setTotalConsultants] = useState(0);
	const [earnedBadges, setEarnedBadges] = useState([]);
	const [recommendations, setRecommendations] = useState([]);
	const [lpProgress, setLpProgress] = useState([]);

	const [historyPage, setHistoryPage] = useState(1);
	const [historySearch, setHistorySearch] = useState('');
	const [historySearchDebounced, setHistorySearchDebounced] = useState('');
	const [historyData, setHistoryData] = useState({ history: [], pagination: null });
	const [historyLoading, setHistoryLoading] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setHistorySearchDebounced(historySearch);
			setHistoryPage(1);
		}, 400);
		return () => clearTimeout(timer);
	}, [historySearch]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const [statsRes, allHistRes, earnedRes, recsRes, lpRes, rankRes] = await Promise.all([
					getConsultantStats(),
					getPointsHistoryAll(),
					getEarnedBadges({ page: 1, limit: 50 }),
					getRecommendations({ page: 1, limit: 3 }),
					getLearningPathProgress(),
					getRanking({ page: 1, limit: 1 }),
				]);
				if (cancelled) return;
				setStats(statsRes);
				setAllHistory(allHistRes);
				setEarnedBadges(earnedRes.badges);
				setRecommendations(recsRes.recommendations);
				setLpProgress(lpRes);
				const firstRanker = rankRes.rankings[0];
				setTotalConsultants(firstRanker?.total_count ?? rankRes.pagination?.totalItems ?? 0);
			} catch (err) {
				console.error('Failed to load points data', err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const fetchHistory = useCallback(async () => {
		setHistoryLoading(true);
		try {
			const params = { page: historyPage, limit: PAGE_SIZE };
			if (historySearchDebounced) params.search = historySearchDebounced;
			const res = await getPointsHistory(params);
			setHistoryData(res);
		} catch (err) {
			console.error('Failed to load points history', err);
		} finally {
			setHistoryLoading(false);
		}
	}, [historyPage, historySearchDebounced]);

	useEffect(() => { fetchHistory(); }, [fetchHistory]);

	const weekStats = useMemo(() => computeWeekOverWeek(allHistory), [allHistory]);
	const monthStats = useMemo(() => computeMonthOverMonth(allHistory), [allHistory]);
	const weeklyAvg = useMemo(() => {
		if (!allHistory.length) return 0;
		const oldest = new Date(allHistory[allHistory.length - 1]?.created_at);
		const weeks = Math.max(1, Math.ceil((Date.now() - oldest) / (7 * 24 * 60 * 60 * 1000)));
		const total = allHistory.reduce((s, e) => s + e.points_delta, 0);
		return Math.round(total / weeks);
	}, [allHistory]);

	const monthlyChartData = useMemo(() =>
		aggregateByMonth(allHistory).map(d => ({
			month: t(`shared.months.${MONTH_KEYS[d.date.getMonth()]}`),
			points: d.points,
		})),
		[allHistory, t]
	);

	const weeklyChartData = useMemo(() =>
		aggregateByDayOfWeek(allHistory).map(d => ({
			day: t(`shared.days.${d.key}`),
			points: d.points,
		})),
		[allHistory, t]
	);

	const heatmapData = useMemo(() => buildHeatmap(allHistory), [allHistory]);

	const percentile = useMemo(() => {
		if (!stats?.rankingPosition || !totalConsultants) return null;
		return Math.max(1, Math.round((stats.rankingPosition / totalConsultants) * 100));
	}, [stats, totalConsultants]);

	const milestones = useMemo(() =>
		lpProgress.slice(0, 3).map((lp, i) => ({
			id: lp.learning_path_id,
			name: lp.path_title,
			current: Number(lp.earned_badges ?? lp.badges_earned ?? 0),
			target: Number(lp.total_badges ?? 0),
			percent: Math.round(Number(lp.progress_pct ?? lp.progress_percentage ?? 0)),
			color: LP_PROGRESS_COLORS[i % LP_PROGRESS_COLORS.length],
		})),
		[lpProgress]
	);

	const achievementBonus = useMemo(() =>
		earnedBadges.reduce((sum, b) => sum + (b.badge?.pointsValue ?? 0), 0),
		[earnedBadges]
	);

	const totalPoints = stats?.totalPoints ?? 0;
	const rankPosition = stats?.rankingPosition;
	const milestoneIcons = ['badge', 'certificate', 'spark'];
	const historyPagination = historyData.pagination;
	const totalHistoryPages = historyPagination?.totalPages ?? 1;

	if (loading) {
		return (
			<div className={styles.page}>
				<div className="row g-3 mb-4">
					<div className="col-12 col-lg-7"><Skeleton height={430} borderRadius="16px" /></div>
					<div className="col-12 col-lg-5"><Skeleton height={430} borderRadius="16px" /></div>
				</div>
				<div className="row g-3 mb-4">
					<div className="col-12 col-lg-6"><Skeleton height={340} borderRadius="16px" /></div>
					<div className="col-12 col-lg-6"><Skeleton height={340} borderRadius="16px" /></div>
				</div>
				<Skeleton height={400} borderRadius="16px" />
			</div>
		);
	}

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
										{totalPoints.toLocaleString('pt-PT')}
									</span>
									<span className={styles.heroBadgeGreen}>
										<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
										+{weekStats.thisWeek} {t('points.thisWeek')}
									</span>
								</div>
							</div>
							{percentile != null && (
								<div className={styles.rankBadge}>
									<Icon name="star-points" size={30} color="var(--color-orange-on-soft)" />
									<span className={styles.rankBadgeValue}>Top {percentile}%</span>
									<span className={styles.rankBadgeSub}>{t('points.consultant')}</span>
								</div>
							)}
						</div>

						<div className={styles.motivationalBanner}>
							<div className={styles.motivationalIcon}>
								<Icon name="star-points" size={16} color="var(--color-secondary)" />
							</div>
							<div className={styles.motivationalText}>
								<p className={styles.motivationalMain}>
									{t('points.motivational', {
										gain: weekStats.thisWeek,
										percent: percentile != null ? (100 - percentile) : '—',
									})}
								</p>
								<p className={styles.motivationalHint}>{t('points.motivationalHint')}</p>
							</div>
						</div>

						<div className={styles.miniStats}>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.thisMonth')}</span>
									<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>{monthStats.thisMonth}</span>
								<span className={styles.miniStatChange}>
									{monthStats.change >= 0 ? '+' : ''}{monthStats.change}% {t('points.vsLastMonth')}
								</span>
							</div>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.weeklyAvg')}</span>
									<Icon name="evolution" size={14} color="var(--color-green-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>{weeklyAvg}</span>
								<span className={styles.miniStatChange}>
									{weekStats.change >= 0 ? '+' : ''}{weekStats.change}% {t('points.vsLastWeek')}
								</span>
							</div>
							<div className={styles.miniStat}>
								<div className={styles.miniStatHeader}>
									<span className={styles.miniStatLabel}>{t('points.rankPosition')}</span>
									<Icon name="trophy" size={14} color="var(--color-orange-on-soft)" />
								</div>
								<span className={styles.miniStatValue}>
									{rankPosition != null ? `#${rankPosition}` : '—'}
								</span>
								<span className={styles.miniStatSub}>
									{t('points.outOf', { total: totalConsultants })}
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
							{milestones.length === 0 && (
								<p className={styles.emptyText}>{t('points.noMilestones')}</p>
							)}
							{milestones.map((m, i) => (
								<div key={m.id} className={styles.milestoneItem}>
									<div className={styles.milestoneIcon}>
										<Icon name={milestoneIcons[i] || 'badge'} size={18} color={m.color} />
									</div>
									<div className={styles.milestoneInfo}>
										<div className={styles.milestoneTop}>
											<span className={styles.milestoneName}>{m.name}</span>
											<span className={styles.milestoneCounter}>
												{m.current}/{m.target}
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

			{/* ═══ ROW 2: Charts ═══ */}
			<h6 className={styles.sectionTitle}>{t('points.metricsTitle')}</h6>
			<div className="row g-3 mb-4">
				<div className="col-12 col-lg-6">
					<ContentCard>
						<div className={styles.chartHeader}>
							<span className={styles.chartTitle}>{t('points.pointsByMonth')}</span>
						</div>
						<VerticalBarChart
							data={monthlyChartData}
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
							data={weeklyChartData}
							xAxisKey="day"
							yAxisKey="points"
							height={180}
						/>
						<div className={styles.heatmapSection}>
							<ActivityHeatmap
								data={heatmapData}
								weeks={4}
								title={t('points.heatmapTitle')}
							/>
						</div>
					</ContentCard>
				</div>
			</div>

			{/* ═══ ROW 3: Recommendations + Achievements ═══ */}
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
							{recommendations.length === 0 && (
								<p className={styles.emptyText}>{t('points.noRecommendations')}</p>
							)}
							{recommendations.map((r, i) => (
								<div key={r.badge_id ?? i} className={styles.recommendItem}>
									<div className={styles.recommendIcon}>
										<Icon name="badge" size={18} color="var(--color-secondary)" />
									</div>
									<div className={styles.recommendInfo}>
										<div className={styles.recommendNameRow}>
											<span className={styles.recommendName}>{r.badge_title}</span>
											{i === 0 && (
												<span className={styles.recommendTag}>{t('points.recommended')}</span>
											)}
										</div>
										<p className={styles.recommendDesc}>
											{r.area_name && r.service_line_name
												? `${r.service_line_name} · ${r.area_name}`
												: r.area_name || r.service_line_name || r.badge_type || ''
											}
										</p>
									</div>
									<div className={styles.recommendPoints}>
										<span className={styles.recommendPointsValue}>+{r.badge_points}</span>
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
							{earnedBadges.length === 0 && (
								<p className={styles.emptyText}>{t('points.noAchievements')}</p>
							)}
							{earnedBadges.slice(0, 3).map(a => (
								<div key={a.awardedBadgeId} className={styles.achievementItem}>
									<div className={styles.achievementLeft}>
										<Icon name="certificate" size={16} color="var(--color-secondary)" />
										<div className={styles.achievementInfo}>
											<span className={styles.achievementName}>{a.badge?.title ?? '—'}</span>
											<div className={styles.achievementMeta}>
												<span className={styles.achievementType}>{a.badge?.pointsValue ?? 0} pts</span>
												<span className={styles.achievementDate}>
													{a.awardedDate ? new Date(a.awardedDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
												</span>
											</div>
										</div>
									</div>
									<span className={styles.achievementBonus}>
										+{a.badge?.pointsValue ?? 0} pts
									</span>
								</div>
							))}
						</div>
						{earnedBadges.length > 0 && (
							<div className={styles.achievementsTotal}>
								<span>{t('points.totalCertBonus')}</span>
								<span className={styles.achievementsTotalValue}>{achievementBonus} pts</span>
							</div>
						)}
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
								onChange={e => setHistorySearch(e.target.value)}
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
							{historyLoading ? (
								Array.from({ length: PAGE_SIZE }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j}><Skeleton height={16} /></td>
										))}
									</tr>
								))
							) : historyData.history.length === 0 ? (
								<tr>
									<td colSpan={6} className={styles.emptyTableCell}>
										{t('points.noHistoryResults')}
									</td>
								</tr>
							) : (
								historyData.history.map(row => {
									const badge = row.badge;
									const slName = badge?.service_line?.service_line_name;
									const areaName = badge?.area?.area_name;
									const hasExpiration = badge?.expiration_duration_days != null;
									const statusKey = row.requirement_id && !row.badge_id
										? 'pending'
										: hasExpiration ? 'expired' : 'verified';

									return (
										<tr key={row.points_history_id}>
											<td className={styles.cellDate}>
												{new Date(row.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
											</td>
											<td>
												<div className={styles.cellBadge}>
													<span className={styles.cellBadgeName}>
														{badge?.badge_title ?? row.justification ?? '—'}
													</span>
													{row.requirement?.requirement_title && (
														<span className={styles.cellBadgeValidator}>
															{row.requirement.requirement_title}
														</span>
													)}
												</div>
											</td>
											<td>
												{slName
													? <span className={styles.cellPill}>{slName}</span>
													: <span className={styles.cellEmpty}>—</span>
												}
											</td>
											<td>
												{areaName
													? <span className={styles.cellPill}>{areaName}</span>
													: <span className={styles.cellEmpty}>—</span>
												}
											</td>
											<td className={styles.cellPoints}>+{row.points_delta}</td>
											<td>
												<span className={`${styles.statusBadge} ${styles[`status_${statusKey}`]}`}>
													{t(`points.statusType.${statusKey}`)}
												</span>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
				<div className={styles.pagination}>
					<span className={styles.paginationInfo}>
						{t('points.showing', {
							count: historyData.history.length,
							total: historyPagination?.totalItems ?? 0,
						})}
					</span>
					<div className={styles.paginationBtns}>
						{Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(p => (
							<button
								key={p}
								className={`${styles.pageBtn} ${p === historyPage ? styles.pageBtnActive : ''}`}
								onClick={() => setHistoryPage(p)}
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
