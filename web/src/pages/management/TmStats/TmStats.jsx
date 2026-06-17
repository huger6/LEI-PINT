import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
	getBadgesByServiceLine,
	getBadgesByLearningPath,
	getLevelDistribution,
} from '../../../features/statistics/api/statisticsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import StatsOverview from '../StatsOverview/StatsOverview';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './TmStats.module.css';

export default function TmStats() {
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Filters shared from the StatsOverview header; applied to the charts too.
	const [chartFilters, setChartFilters] = useState({});
	const filterKey = JSON.stringify(chartFilters);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [bySl, byLp, levels] = await Promise.all([
					getBadgesByServiceLine(chartFilters),
					getBadgesByLearningPath(chartFilters),
					getLevelDistribution(chartFilters),
				]);
				if (active) setData({ bySl, byLp, levels });
			} catch (err) {
				if (active) setError(resolveErrorMessage(err));
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKey]);

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
		</div>
	);
}
