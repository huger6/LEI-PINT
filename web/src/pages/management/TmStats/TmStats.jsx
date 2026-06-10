import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
	getBadgesByServiceLine,
	getBadgesByLearningPath,
	getLevelDistribution,
	getUserEnrollment,
	getPendingApplicationsCount,
	getTeamBadgesCount,
} from '../../../features/statistics/api/statisticsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './TmStats.module.css';

export default function TmStats() {
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [bySl, byLp, levels, enrollment, pending, teamBadges] = await Promise.all([
					getBadgesByServiceLine(),
					getBadgesByLearningPath(),
					getLevelDistribution(),
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
	}, []);

	if (loading) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>
				<CardGridSkeleton count={4} columns={2} />
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>
				<div className={styles.errorCard}>{error}</div>
			</div>
		);
	}

	const kpis = [
		{ icon: 'badge', label: t('tmStats.kpi.badgesAwarded'), value: data.teamBadges.totalBadges, color: 'var(--color-green-on-soft)', bg: 'var(--color-green-soft)' },
		{ icon: 'user', label: t('tmStats.kpi.consultants'), value: data.enrollment?.consultants ?? 0, color: 'var(--color-secondary)', bg: 'var(--color-secondary-container)' },
		{ icon: 'send', label: t('tmStats.kpi.pending'), value: data.pending, color: 'var(--color-purple-on-soft)', bg: 'var(--color-purple-soft)' },
		{ icon: 'check_circle', label: t('tmStats.kpi.activeUsers'), value: data.enrollment?.active_users ?? 0, color: 'var(--color-blue-on-soft)', bg: 'var(--color-blue-soft)' },
	];

	const hasSl = data.bySl.some((r) => r.awarded_count > 0);
	const hasLp = data.byLp.some((r) => r.awarded_count > 0);
	const hasLevels = data.levels.some((r) => r.awarded_count > 0);

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('sidebar.tm.stats')}</h1>

			{/* KPI row */}
			<div className={styles.kpiRow}>
				{kpis.map((k) => (
					<div key={k.label} className={styles.kpiCard}>
						<div className={styles.kpiIcon} style={{ background: k.bg }}>
							<Icon name={k.icon} size={20} color={k.color} />
						</div>
						<span className={styles.kpiValue}>{k.value}</span>
						<span className={styles.kpiLabel}>{k.label}</span>
					</div>
				))}
			</div>

			{/* Charts */}
			<div className={styles.chartsGrid}>
				<ContentCard className={styles.chartCard}>
					<CardHeader icon="service-line" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('tmStats.charts.byServiceLine')} />
					{hasSl ? (
						<VerticalBarChart data={data.bySl} xAxisKey="service_line_name" yAxisKey="awarded_count" />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>

				<ContentCard className={styles.chartCard}>
					<CardHeader icon="badge" iconBg="var(--color-green-soft)" iconColor="var(--color-green-on-soft)" title={t('tmStats.charts.byLevel')} />
					{hasLevels ? (
						<PieDonutChart data={data.levels} nameKey="stage_code" valueKey="awarded_count" isDonut />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>

				<ContentCard className={`${styles.chartCard} ${styles.chartCardWide}`}>
					<CardHeader icon="learning-path" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('tmStats.charts.byLearningPath')} />
					{hasLp ? (
						<VerticalBarChart data={data.byLp} xAxisKey="path_title" yAxisKey="awarded_count" barColor="#39639C" />
					) : (
						<p className={styles.emptyChart}>{t('tmStats.noData')}</p>
					)}
				</ContentCard>
			</div>
		</div>
	);
}
