import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	getBadgesByServiceLine,
	getBadgesByLearningPath,
	getLevelDistribution,
	getUserEnrollment,
	getExpiringBadges,
} from '../../../features/statistics/api/statisticsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Icon from '../../../components/Icons/Icons';
import StatsOverview from '../../management/StatsOverview/StatsOverview';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './AdminStats.module.css';

const EXPIRING_WINDOWS = [30, 90, 180, 365, 730];

function expiringClass(days) {
	if (days <= 30) return styles.daysCritical;
	if (days <= 90) return styles.daysWarning;
	return styles.daysNeutral;
}

/**
 * Administrator-only statistics dashboard. Reuses the leadership aggregate
 * blocks (filters/KPIs, award charts) and adds platform-wide insight only the
 * admin may see: user enrollment by role and the named expiring-badges list.
 */
export default function AdminStats() {
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [enrollment, setEnrollment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [expiring, setExpiring] = useState([]);
	const [expiringWindow, setExpiringWindow] = useState(90);
	const [expiringLoading, setExpiringLoading] = useState(true);

	const [chartFilters, setChartFilters] = useState({});
	const filterKey = JSON.stringify(chartFilters);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [bySl, byLp, levels, enr] = await Promise.all([
					getBadgesByServiceLine(chartFilters),
					getBadgesByLearningPath(chartFilters),
					getLevelDistribution(chartFilters),
					getUserEnrollment(),
				]);
				if (active) { setData({ bySl, byLp, levels }); setEnrollment(enr); }
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
			setExpiring(await getExpiringBadges(withinDays));
		} catch {
			setExpiring([]);
		} finally {
			setExpiringLoading(false);
		}
	}, []);

	useEffect(() => { loadExpiring(expiringWindow); }, [loadExpiring, expiringWindow]);

	if (loading && !data) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('adminStats.title')}</h1>
				<CardGridSkeleton count={4} columns={2} />
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className={styles.page}>
				<h1 className={styles.pageTitle}>{t('adminStats.title')}</h1>
				<div className={styles.errorCard}>{error}</div>
			</div>
		);
	}

	const hasSl = data.bySl.some((r) => r.awarded_count > 0);
	const hasLp = data.byLp.some((r) => r.awarded_count > 0);
	const hasLevels = data.levels.some((r) => r.awarded_count > 0);

	const enrollmentCards = enrollment ? [
		{ key: 'total', label: t('adminStats.enrollment.total'), value: enrollment.total_users, icon: 'tabler_users', bg: 'var(--color-secondary-container)', color: 'var(--color-secondary)' },
		{ key: 'active', label: t('adminStats.enrollment.active'), value: enrollment.active_users, icon: 'check_circle', bg: 'var(--color-green-soft)', color: 'var(--color-green-on-soft)' },
		{ key: 'inactive', label: t('adminStats.enrollment.inactive'), value: enrollment.inactive_users, icon: 'clock', bg: 'var(--color-surface-overlay-85)', color: 'var(--color-outline)' },
		{ key: 'confirmed', label: t('adminStats.enrollment.confirmed'), value: enrollment.confirmed_users, icon: 'check_circle', bg: 'var(--color-blue-soft)', color: 'var(--color-blue-on-soft)' },
		{ key: 'consultants', label: t('adminStats.enrollment.consultants'), value: enrollment.consultants, icon: 'user', bg: 'var(--color-primary-soft)', color: 'var(--color-primary)' },
		{ key: 'sll', label: t('adminStats.enrollment.serviceLineLeaders'), value: enrollment.service_line_leaders, icon: 'user', bg: 'var(--color-purple-soft)', color: 'var(--color-purple-on-soft)' },
		{ key: 'tm', label: t('adminStats.enrollment.talentManagers'), value: enrollment.talent_managers, icon: 'user', bg: 'var(--color-orange-soft)', color: 'var(--color-orange-on-soft)' },
		{ key: 'admins', label: t('adminStats.enrollment.administrators'), value: enrollment.administrators, icon: 'user', bg: 'var(--color-secondary-container)', color: 'var(--color-secondary)' },
	] : [];

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('adminStats.title')}</h1>

			{/* Advanced filters + KPI cards */}
			<StatsOverview onFiltersChange={setChartFilters} />

			{/* Platform-wide user enrollment (admin-only) */}
			<ContentCard className={styles.section}>
				<CardHeader icon="tabler_users" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('adminStats.enrollment.title')} />
				<div className={styles.enrollGrid}>
					{enrollmentCards.map((c) => (
						<div key={c.key} className={styles.enrollCard}>
							<div className={styles.enrollIcon} style={{ background: c.bg }}>
								<Icon name={c.icon} size={18} color={c.color} />
							</div>
							<span className={styles.enrollValue}>{Number(c.value ?? 0).toLocaleString('pt-PT')}</span>
							<span className={styles.enrollLabel}>{c.label}</span>
						</div>
					))}
				</div>
			</ContentCard>

			{/* Award charts */}
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

			{/* Exports (admin: full data incl. PII) */}
			<ExportsPanel />

			{/* Expiring badges — named list (admin-only) */}
			<ContentCard className={styles.section}>
				<div className={styles.sectionHeaderRow}>
					<CardHeader icon="clock" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('tmStats.expiring.title')} />
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('tmStats.expiring.window')}</span>
						<CustomSelect
							name="expiringWindow"
							value={String(expiringWindow)}
							onChange={(e) => setExpiringWindow(Number(e.target.value))}
							options={EXPIRING_WINDOWS.map((d) => ({ value: String(d), label: t('tmStats.expiring.days', { count: d }) }))}
							ariaLabel={t('tmStats.expiring.window')}
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
