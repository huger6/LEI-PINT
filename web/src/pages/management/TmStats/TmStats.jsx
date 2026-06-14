import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	getBadgesByServiceLine,
	getBadgesByLearningPath,
	getLevelDistribution,
	getUserEnrollment,
	getPendingApplicationsCount,
	getTeamBadgesCount,
	getExpiringBadges,
} from '../../../features/statistics/api/statisticsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import StatsOverview from '../StatsOverview/StatsOverview';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './TmStats.module.css';

const EXPIRING_WINDOWS = [30, 90, 180, 365, 730];

function expiringClass(days) {
	if (days <= 30) return styles.daysCritical;
	if (days <= 90) return styles.daysWarning;
	return styles.daysNeutral;
}

export default function TmStats() {
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Expiring badges
	const [expiring, setExpiring] = useState([]);
	const [expiringWindow, setExpiringWindow] = useState(90);
	const [expiringLoading, setExpiringLoading] = useState(true);

	// Filters shared from the StatsOverview header; applied to the charts too.
	const [chartFilters, setChartFilters] = useState({});
	const filterKey = JSON.stringify(chartFilters);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [bySl, byLp, levels, enrollment, pending, teamBadges] = await Promise.all([
					getBadgesByServiceLine(chartFilters),
					getBadgesByLearningPath(chartFilters),
					getLevelDistribution(chartFilters),
					getUserEnrollment(),
					getPendingApplicationsCount(),
					getTeamBadgesCount(),
				]);
				if (active) setData({ bySl, byLp, levels, enrollment, pending, teamBadges });
			} catch (err) {
				if (active) setError(resolveErrorMessage(err));
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKey]);

	const loadExpiring = useCallback(async (withinDays) => {
		setExpiringLoading(true);
		try {
			const rows = await getExpiringBadges(withinDays);
			setExpiring(rows);
		} catch {
			setExpiring([]);
		} finally {
			setExpiringLoading(false);
		}
	}, []);

	useEffect(() => {
		loadExpiring(expiringWindow);
	}, [loadExpiring, expiringWindow]);

	if (loading && !data) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>
				<CardGridSkeleton count={4} columns={2} />
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>
				<div className={styles.errorCard}>{error}</div>
			</div>
		);
	}

	const hasSl = data.bySl.some((r) => r.awarded_count > 0);
	const hasLp = data.byLp.some((r) => r.awarded_count > 0);
	const hasLevels = data.levels.some((r) => r.awarded_count > 0);

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>

			{/* Advanced filters + KPI cards (filters also drive the charts below) */}
			<StatsOverview onFiltersChange={setChartFilters} />

			{/* Charts */}
			<div className={styles.chartsGrid}>
				<ContentCard className={styles.chartCard}>
					<CardHeader icon="service-line" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('tmStats.charts.byServiceLine')} />
					{hasSl ? (
						<VerticalBarChart data={data.bySl} xAxisKey="service_line_name" yAxisKey="awarded_count" valueName={t('tmStats.kpi.badgesAwarded')} />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>

				<ContentCard className={styles.chartCard}>
					<CardHeader icon="badge" iconBg="var(--color-green-soft)" iconColor="var(--color-green-on-soft)" title={t('tmStats.charts.byLevel')} />
					{hasLevels ? (
						<PieDonutChart data={data.levels} nameKey="stage_code" valueKey="awarded_count" valueName={t('tmStats.kpi.badgesAwarded')} isDonut />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>

				<ContentCard className={`${styles.chartCard} ${styles.chartCardWide}`}>
					<CardHeader icon="learning-path" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('tmStats.charts.byLearningPath')} />
					{hasLp ? (
						<VerticalBarChart data={data.byLp} xAxisKey="path_title" yAxisKey="awarded_count" barColor="#39639C" valueName={t('tmStats.kpi.badgesAwarded')} />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>
			</div>

			{/* Exports */}
			<ExportsPanel />

			{/* Expiring badges */}
			<ContentCard className={styles.chartCard}>
				<div className={styles.sectionHeaderRow}>
					<CardHeader icon="clock" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('tmStats.expiring.title')} />
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.expiring.window')}</span>
						<CustomSelect
								name="expiringWindow"
								value={String(expiringWindow)}
								onChange={(e) => setExpiringWindow(Number(e.target.value))}
								options={EXPIRING_WINDOWS.map((d) => ({ value: String(d), label: t("tmStats.expiring.days", { count: d }) }))}
								ariaLabel={t("tmStats.expiring.window")}
								compact
							/>
					</label>
				</div>

				{expiringLoading ? (
					<p className={styles.emptyChart}>—</p>
				) : expiring.length === 0 ? (
					<p className={styles.emptyChart}>{t('tmStats.expiring.empty')}</p>
				) : (
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead>
								<tr>
									<th>{t('tmStats.expiring.consultant')}</th>
									<th>{t('tmStats.expiring.badge')}</th>
									<th>{t('tmStats.expiring.expiresOn')}</th>
									<th className="text-end">{t('tmStats.expiring.daysRemaining')}</th>
								</tr>
							</thead>
							<tbody>
								{expiring.map((row, idx) => (
									<tr key={`${row.user_guid}-${row.badge_slug}-${idx}`}>
										<td>{row.full_name}</td>
										<td>{row.badge_title}</td>
										<td className="text-muted">
											{new Date(row.expiration_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
										</td>
										<td className="text-end">
											<span className={`${styles.daysChip} ${expiringClass(row.days_remaining)}`}>
												{row.days_remaining} {t('tmStats.expiring.daysShort')}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</ContentCard>

		</div>
	);
}
