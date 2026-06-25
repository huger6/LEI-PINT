import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadgesSummary } from '../../../features/statistics/api/statisticsApi';
import { getLearningPaths, getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import { useUser } from '../../../hooks/userContext';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import DatePicker from '../../../components/DatePicker/DatePicker';
import Icon from '../../../components/Icons/Icons';
import styles from './StatsOverview.module.css';

/**
 * Leadership stats header (Figma TM20/SL10): always-visible "Filtros Avançados"
 * card (Área / Service Line / Período) and KPI cards (Total Badges, Standard,
 * Premium, Approval Rate), backed by GET /statistics/badges-summary. SLL is
 * scoped server-side and hides the Service Line filter.
 */
export default function StatsOverview({ onFiltersChange }) {
	// Access translation function.
	const { t } = useTranslation();
	// Retrieve the current authenticated user.
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';

	// Store the badges summary KPI data from the API.
	const [summary, setSummary] = useState(null);
	// Track whether the summary data is loading.
	const [loading, setLoading] = useState(true);

	// Store the selected learning path filter ID.
	const [learningPathId, setLearningPathId] = useState('');
	// Store the selected service line filter ID.
	const [serviceLineId, setServiceLineId] = useState('');
	// Store the selected area filter ID.
	const [areaId, setAreaId] = useState('');
	// Store the selected "from" date filter value.
	const [dateFrom, setDateFrom] = useState('');
	// Store the selected "to" date filter value.
	const [dateTo, setDateTo] = useState('');

	// Store the list of learning paths for filter options.
	const [learningPaths, setLearningPaths] = useState([]);
	// Store the list of service lines for filter options.
	const [serviceLines, setServiceLines] = useState([]);
	// Store the list of areas for filter options.
	const [areas, setAreas] = useState([]);

	// Load hierarchy filter options on mount, skipping service lines for SLL.
	useEffect(() => {
		let active = true;
		(async () => {
			const [lps, sls, ars] = await Promise.all([
				getLearningPaths().catch(() => []),
				isSll ? Promise.resolve([]) : getServiceLines().catch(() => []),
				getAreas().catch(() => []),
			]);
			if (!active) return;
			setLearningPaths(lps || []);
			setServiceLines(sls || []);
			setAreas(ars || []);
		})();
		return () => { active = false; };
	}, [isSll]);

	// Fetch the badges summary whenever filter values change.
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const params = {};
			if (learningPathId) params.learningPathId = learningPathId;
			if (!isSll && serviceLineId) params.serviceLineId = serviceLineId;
			if (areaId) params.areaId = areaId;
			if (dateFrom) params.dateFrom = dateFrom;
			if (dateTo) params.dateTo = dateTo;
			setSummary(await getBadgesSummary(params));
		} catch {
			setSummary(null);
		} finally {
			setLoading(false);
		}
	}, [isSll, learningPathId, serviceLineId, areaId, dateFrom, dateTo]);

	// Re-fetch summary whenever active filters change.
	useEffect(() => { load(); }, [load]);

	// Notify the parent so it can apply the same filters to its charts.
	useEffect(() => {
		if (!onFiltersChange) return;
		const f = {};
		if (learningPathId) f.learningPathId = learningPathId;
		if (!isSll && serviceLineId) f.serviceLineId = serviceLineId;
		if (areaId) f.areaId = areaId;
		if (dateFrom) f.dateFrom = dateFrom;
		if (dateTo) f.dateTo = dateTo;
		onFiltersChange(f);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [learningPathId, serviceLineId, areaId, dateFrom, dateTo, isSll]);

	const kpis = [
		{ key: 'total', value: summary?.total ?? 0, icon: 'badge', bg: 'var(--color-secondary-container)', iconColor: 'var(--color-secondary)', valueClass: styles.valTotal, label: t('statsOverview.totalBadges') },
		{ key: 'standard', value: summary?.standard ?? 0, icon: 'badge', bg: 'var(--color-blue-soft)', iconColor: 'var(--color-blue-on-soft)', valueClass: styles.valStandard, label: t('statsOverview.standard') },
		{ key: 'premium', value: summary?.premium ?? 0, icon: 'star', bg: 'var(--color-orange-soft)', iconColor: 'var(--color-orange-on-soft)', valueClass: styles.valPremium, label: t('statsOverview.premium') },
		{ key: 'rate', value: `${summary?.approvalRate ?? 0}%`, icon: 'check_circle', bg: 'var(--color-green-soft)', iconColor: 'var(--color-green-on-soft)', valueClass: styles.valRate, label: t('statsOverview.approvalRate') },
	];

	const lpOptions = [{ value: '', label: t('statsOverview.allLearningPaths') },
		...learningPaths.map((lp) => ({ value: String(lp.learning_path_id), label: lp.path_title }))];
	// Cascade: Service Lines limited to the chosen Learning Path, Areas to the chosen Service Line.
	const slOptions = [{ value: '', label: t('statsOverview.allServiceLines') },
		...serviceLines
			.filter((sl) => !learningPathId || String(sl.learning_path_id) === String(learningPathId))
			.map((sl) => ({ value: String(sl.service_line_id), label: sl.service_line_name }))];
	const areaOptions = [{ value: '', label: t('statsOverview.allAreas') },
		...areas
			.filter((a) => !serviceLineId || String(a.service_line_id) === String(serviceLineId))
			.map((a) => ({ value: String(a.area_id), label: a.area_name }))];

	// Reset cascading filters when the learning path changes.
	const onLpChange = (e) => { setLearningPathId(e.target.value); setServiceLineId(''); setAreaId(''); };
	// Reset area when service line changes.
	const onSlChange = (e) => { setServiceLineId(e.target.value); setAreaId(''); };

	return (
		<div className={styles.wrap}>
			{/* Advanced filters (always visible, per Figma) */}
			<ContentCard className={styles.filtersCard}>
				<CardHeader icon="filter" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('statsOverview.advancedFilters')} />
				<div className={styles.filtersGrid}>
					<div className={styles.field}>
						<label className={styles.fieldLabel}>{t('statsOverview.learningPath')}</label>
						<CustomSelect name="learningPathId" value={learningPathId} onChange={onLpChange}
							options={lpOptions} ariaLabel={t('statsOverview.learningPath')} />
					</div>
					{!isSll && (
						<div className={styles.field}>
							<label className={styles.fieldLabel}>{t('statsOverview.serviceLine')}</label>
							<CustomSelect name="serviceLineId" value={serviceLineId} onChange={onSlChange}
								options={slOptions} ariaLabel={t('statsOverview.serviceLine')} />
						</div>
					)}
					<div className={styles.field}>
						<label className={styles.fieldLabel}>{t('statsOverview.area')}</label>
						<CustomSelect name="areaId" value={areaId} onChange={(e) => setAreaId(e.target.value)}
							options={areaOptions} ariaLabel={t('statsOverview.area')} />
					</div>
					<div className={styles.field}>
						<label className={styles.fieldLabel}>{t('statsOverview.from')}</label>
						<DatePicker name="dateFrom" value={dateFrom} max={dateTo || undefined}
							onChange={(e) => setDateFrom(e.target.value)} ariaLabel={t('statsOverview.from')} />
					</div>
					<div className={styles.field}>
						<label className={styles.fieldLabel}>{t('statsOverview.to')}</label>
						<DatePicker name="dateTo" value={dateTo} min={dateFrom || undefined}
							onChange={(e) => setDateTo(e.target.value)} ariaLabel={t('statsOverview.to')} />
					</div>
				</div>
			</ContentCard>

			{/* KPI cards */}
			<div className={styles.kpiRow}>
				{kpis.map((k) => (
					<div key={k.key} className={styles.kpiCard}>
						<div className={styles.kpiIcon} style={{ background: k.bg }}>
							<Icon name={k.icon} size={18} color={k.iconColor} />
						</div>
						<span className={styles.kpiLabel}>{k.label}</span>
						<span className={`${styles.kpiValue} ${k.valueClass}`}>{loading ? '—' : k.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}
