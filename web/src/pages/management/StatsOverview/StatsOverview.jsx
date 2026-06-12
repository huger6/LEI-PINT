import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBadgesSummary } from '../../../features/statistics/api/statisticsApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import { useUser } from '../../../hooks/userContext';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './StatsOverview.module.css';

/**
 * Leadership stats header: advanced filters (area / service line / period) and
 * KPI cards (total badges, standard, premium, approval rate), backed by
 * GET /statistics/badges-summary. SLL is scoped server-side and hides the
 * Service Line filter. Rendered at the top of TmStats and SllStats.
 */
export default function StatsOverview() {
	const { t } = useTranslation();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';

	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(true);

	const [showFilters, setShowFilters] = useState(false);
	const [serviceLineId, setServiceLineId] = useState('');
	const [areaId, setAreaId] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);

	useEffect(() => {
		let active = true;
		(async () => {
			const [sls, ars] = await Promise.all([
				isSll ? Promise.resolve([]) : getServiceLines().catch(() => []),
				getAreas().catch(() => []),
			]);
			if (!active) return;
			setServiceLines(sls || []);
			setAreas(ars || []);
		})();
		return () => { active = false; };
	}, [isSll]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const params = {};
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
	}, [isSll, serviceLineId, areaId, dateFrom, dateTo]);

	useEffect(() => { load(); }, [load]);

	function clearFilters() {
		setServiceLineId('');
		setAreaId('');
		setDateFrom('');
		setDateTo('');
	}

	const kpis = [
		{ key: 'total', value: summary?.total ?? 0, icon: 'badge', bg: 'var(--color-secondary-container)', color: 'var(--color-secondary)', label: t('statsOverview.totalBadges') },
		{ key: 'standard', value: summary?.standard ?? 0, icon: 'badge', bg: 'var(--color-purple-soft)', color: 'var(--color-purple-on-soft)', label: t('statsOverview.standard') },
		{ key: 'premium', value: summary?.premium ?? 0, icon: 'trophy', bg: 'var(--color-orange-soft)', color: 'var(--color-orange-on-soft)', label: t('statsOverview.premium') },
		{ key: 'rate', value: `${summary?.approvalRate ?? 0}%`, icon: 'check_circle', bg: 'var(--color-green-soft)', color: 'var(--color-green-on-soft)', label: t('statsOverview.approvalRate') },
	];

	const slOptions = [{ value: '', label: t('statsOverview.allServiceLines') },
		...serviceLines.map((sl) => ({ value: String(sl.service_line_id), label: sl.service_line_name }))];
	const areaOptions = [{ value: '', label: t('statsOverview.allAreas') },
		...areas.map((a) => ({ value: String(a.area_id), label: a.area_name }))];

	return (
		<div className={styles.wrap}>
			<div className={styles.headerRow}>
				<h2 className={styles.title}>{t('statsOverview.title')}</h2>
				<Button variant="outlined" color="primary" size="sm" onClick={() => setShowFilters((v) => !v)}>
					<Icon name="filter" size={16} /> {t('statsOverview.filters')}
				</Button>
			</div>

			{showFilters && (
				<div className={styles.filtersBar}>
					{!isSll && (
						<CustomSelect name="serviceLineId" value={serviceLineId} onChange={(e) => setServiceLineId(e.target.value)}
							options={slOptions} ariaLabel={t('statsOverview.serviceLine')} compact />
					)}
					<CustomSelect name="areaId" value={areaId} onChange={(e) => setAreaId(e.target.value)}
						options={areaOptions} ariaLabel={t('statsOverview.area')} compact />
					<label className={styles.dateField}>
						<span>{t('statsOverview.from')}</span>
						<input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
					</label>
					<label className={styles.dateField}>
						<span>{t('statsOverview.to')}</span>
						<input type="date" className={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
					</label>
					<Button variant="text" color="primary" size="sm" onClick={clearFilters}>{t('statsOverview.clear')}</Button>
				</div>
			)}

			<div className={styles.kpiRow}>
				{kpis.map((k) => (
					<div key={k.key} className={styles.kpiCard}>
						<div className={styles.kpiIcon} style={{ background: k.bg }}>
							<Icon name={k.icon} size={20} color={k.color} />
						</div>
						<div className={styles.kpiBody}>
							<span className={styles.kpiValue}>{loading ? '—' : k.value}</span>
							<span className={styles.kpiLabel}>{k.label}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
