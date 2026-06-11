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
import BadgeOverview from '../../../components/BadgeOverview/BadgeOverview';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import Icon from '../../../components/Icons/Icons';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './TmStats.module.css';

const EXPIRING_WINDOWS = [30, 90, 180, 365];

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

			{/* Exports */}
			<ExportsPanel />

			{/* Expiring badges */}
			<ContentCard className={styles.chartCard}>
				<div className={styles.sectionHeaderRow}>
					<CardHeader icon="clock" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('tmStats.expiring.title')} />
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.expiring.window')}</span>
						<select
							className="form-select form-select-sm"
							value={expiringWindow}
							onChange={(e) => setExpiringWindow(Number(e.target.value))}
							aria-label={t('tmStats.expiring.window')}
						>
							{EXPIRING_WINDOWS.map((d) => (
								<option key={d} value={d}>{t('tmStats.expiring.days', { count: d })}</option>
							))}
						</select>
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

			{/* Points system per badge (req 15) + special/premium badges (req 16) */}
			<BadgeOverview />
		</div>
	);
}
