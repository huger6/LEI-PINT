import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadgeDistribution, getBadgesByRange } from '../../features/statistics/api/statisticsApi';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import CustomSelect from '../CustomSelect/CustomSelect';
import styles from './BadgeReports.module.css';

// Default reporting window: the last 12 months (used when the shared filters
// carry no explicit date range — the by-range report requires both dates).
function defaultRange() {
	const to = new Date();
	const from = new Date();
	from.setMonth(from.getMonth() - 11);
	from.setDate(1);
	const fmt = (d) => d.toISOString().slice(0, 10);
	return { from: fmt(from), to: fmt(to) };
}

/**
 * Reusable leadership reporting block (mandatory dashboard reports):
 *   1. "% de Badges com visão mensal" — monthly badge distribution, the share of
 *      each month's awards per Learning Path / Service Line / Área.
 *   2. "# de Badges por intervalo de datas" — badges awarded within a date range.
 *
 * Backed by GET /statistics/reports/badge-distribution and /badges-by-range.
 * Inherits the page filters (learningPathId/serviceLineId/areaId/dateFrom/dateTo)
 * emitted by <StatsOverview/>; falls back to the last 12 months when no dates set.
 */
export default function BadgeReports({ filters = {} }) {
	const { t } = useTranslation();
	const [groupBy, setGroupBy] = useState('learning_path');
	const [distribution, setDistribution] = useState([]);
	const [byRange, setByRange] = useState([]);
	const [loadingDist, setLoadingDist] = useState(true);
	const [loadingRange, setLoadingRange] = useState(true);

	const range = useMemo(() => {
		const d = defaultRange();
		return { from: filters.dateFrom || d.from, to: filters.dateTo || d.to };
	}, [filters.dateFrom, filters.dateTo]);

	// Monthly distribution (dates optional).
	useEffect(() => {
		let active = true;
		setLoadingDist(true);
		const params = { groupBy };
		if (filters.dateFrom) params.dateFrom = filters.dateFrom;
		if (filters.dateTo) params.dateTo = filters.dateTo;
		getBadgeDistribution(params)
			.then((rows) => { if (active) setDistribution(rows); })
			.catch(() => { if (active) setDistribution([]); })
			.finally(() => { if (active) setLoadingDist(false); });
		return () => { active = false; };
	}, [groupBy, filters.dateFrom, filters.dateTo]);

	// Badges by range (dates required → fall back to last 12 months).
	useEffect(() => {
		let active = true;
		setLoadingRange(true);
		const params = { dateFrom: range.from, dateTo: range.to };
		if (filters.learningPathId) params.learningPathId = filters.learningPathId;
		if (filters.serviceLineId) params.serviceLineId = filters.serviceLineId;
		if (filters.areaId) params.areaId = filters.areaId;
		getBadgesByRange(params)
			.then((rows) => { if (active) setByRange(rows); })
			.catch(() => { if (active) setByRange([]); })
			.finally(() => { if (active) setLoadingRange(false); });
		return () => { active = false; };
	}, [range.from, range.to, filters.learningPathId, filters.serviceLineId, filters.areaId]);

	// Group the flat distribution rows by month (most recent first).
	const months = useMemo(() => {
		const map = new Map();
		for (const r of distribution) {
			if (!map.has(r.period_month)) map.set(r.period_month, []);
			map.get(r.period_month).push(r);
		}
		return Array.from(map.entries())
			.sort((a, b) => (a[0] < b[0] ? 1 : -1))
			.map(([month, rows]) => ({
				month,
				rows: [...rows].sort((x, y) => Number(y.awarded_count) - Number(x.awarded_count)),
			}));
	}, [distribution]);

	const fmtMonth = (m) => new Date(m).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
	const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

	const groupByOptions = [
		{ value: 'learning_path', label: t('reports.groupBy.learningPath') },
		{ value: 'service_line', label: t('reports.groupBy.serviceLine') },
		{ value: 'area', label: t('reports.groupBy.area') },
	];

	return (
		<div className={styles.wrap}>
			{/* Monthly badge distribution (% per group of each month's awards) */}
			<ContentCard className={styles.section}>
				<div className={styles.sectionHeaderRow}>
					<CardHeader icon="evolution" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('reports.monthly.title')} />
					<label className={styles.inlineSelect}>
						<span className={styles.inlineSelectLabel}>{t('reports.monthly.groupBy')}</span>
						<CustomSelect
							name="reportGroupBy"
							value={groupBy}
							onChange={(e) => setGroupBy(e.target.value)}
							options={groupByOptions}
							ariaLabel={t('reports.monthly.groupBy')}
							compact
						/>
					</label>
				</div>
				<p className={styles.hint}>{t('reports.monthly.hint')}</p>

				{loadingDist ? (
					<p className={styles.empty}>—</p>
				) : months.length === 0 ? (
					<p className={styles.empty}>{t('reports.noData')}</p>
				) : (
					<div className={styles.monthsList}>
						{months.map(({ month, rows }) => (
							<div key={month} className={styles.monthBlock}>
								<div className={styles.monthTitle}>{fmtMonth(month)}</div>
								{rows.map((r) => {
									const pct = Number(r.pct_of_month) || 0;
									return (
										<div key={`${month}-${r.group_id ?? r.group_label}`} className={styles.distRow}>
											<span className={styles.distLabel} title={r.group_label || t('reports.unassigned')}>
												{r.group_label || t('reports.unassigned')}
											</span>
											<div className={styles.barTrack}>
												<div className={styles.barFill} style={{ width: `${Math.min(pct, 100)}%` }} />
											</div>
											<span className={styles.distPct}>{pct.toFixed(1)}%</span>
											<span className={styles.distCount}>{Number(r.awarded_count).toLocaleString('pt-PT')}</span>
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</ContentCard>

			{/* Badges awarded within the selected (or default 12-month) range */}
			<ContentCard className={styles.section}>
				<CardHeader icon="badge" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('reports.byRange.title')} />
				<p className={styles.hint}>
					{t('reports.byRange.hint', { from: fmtDate(range.from), to: fmtDate(range.to) })}
				</p>

				{loadingRange ? (
					<p className={styles.empty}>—</p>
				) : byRange.length === 0 ? (
					<p className={styles.empty}>{t('reports.noData')}</p>
				) : (
					<div className="table-responsive">
						<table className="table table-hover align-middle mb-0">
							<thead>
								<tr>
									<th>{t('reports.byRange.badge')}</th>
									<th className="text-end">{t('reports.byRange.awarded')}</th>
									<th>{t('reports.byRange.firstAwarded')}</th>
									<th>{t('reports.byRange.lastAwarded')}</th>
								</tr>
							</thead>
							<tbody>
								{byRange.map((r) => (
									<tr key={r.badge_id}>
										<td>
											<div className={styles.badgeCell}>
												{r.badge_img_url && (
													<img src={r.badge_img_url} alt="" className={styles.badgeThumb} loading="lazy" />
												)}
												<span>{r.badge_title}</span>
											</div>
										</td>
										<td className="text-end">
											<span className={styles.countChip}>{Number(r.awarded_count).toLocaleString('pt-PT')}</span>
										</td>
										<td className="text-muted">{fmtDate(r.first_awarded_at)}</td>
										<td className="text-muted">{fmtDate(r.last_awarded_at)}</td>
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
