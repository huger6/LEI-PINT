import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getConsultantsOverview } from '../../../features/statistics/api/statisticsApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Avatar from '../../../components/Avatar/Avatar';
import Pagination from '../../../components/Pagination/Pagination';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './ConsultantsList.module.css';

const PAGE_SIZE = 12;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null);

/**
 * Role-aware consultants overview backed by GET /statistics/consultants
 * (SLL scoped server-side to their Service Line). Talent Manager and Service
 * Line Leader get the columns and filters defined in the Figma designs.
 */
export default function ConsultantsList() {
	const { t } = useTranslation();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';

	const [rows, setRows] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Filters
	const [showFilters, setShowFilters] = useState(false);
	const [search, setSearch] = useState('');
	const [serviceLineId, setServiceLineId] = useState('');
	const [areaId, setAreaId] = useState('');
	const [pointsMin, setPointsMin] = useState('');
	const [pointsMax, setPointsMax] = useState('');
	const [sort, setSort] = useState('points_desc');

	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);

	// Filter option sources.
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
		setError('');
		try {
			const params = { page, limit: PAGE_SIZE, sort };
			if (search.trim()) params.search = search.trim();
			if (!isSll && serviceLineId) params.serviceLineId = serviceLineId;
			if (areaId) params.areaId = areaId;
			if (pointsMin !== '') params.pointsMin = pointsMin;
			if (pointsMax !== '') params.pointsMax = pointsMax;
			const { rows: data, pagination: pag } = await getConsultantsOverview(params);
			setRows(data);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setRows([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	}, [page, sort, search, isSll, serviceLineId, areaId, pointsMin, pointsMax]);

	useEffect(() => { load(); }, [load]);

	function applyFilters() {
		setPage(1);
		load();
	}

	function clearFilters() {
		setSearch('');
		setServiceLineId('');
		setAreaId('');
		setPointsMin('');
		setPointsMax('');
		setSort('points_desc');
		setPage(1);
	}

	const total = pagination?.totalItems ?? rows.length;
	const title = isSll ? t('consultantsList.teamTitle') : t('consultantsList.title');

	const slOptions = [{ value: '', label: t('consultantsList.filters.allServiceLines') },
		...serviceLines.map((sl) => ({ value: String(sl.service_line_id), label: sl.service_line_name }))];
	const areaOptions = [{ value: '', label: t('consultantsList.filters.allAreas') },
		...areas.map((a) => ({ value: String(a.area_id), label: a.area_name }))];
	const sortOptions = [
		{ value: 'points_desc', label: t('consultantsList.filters.sortPointsDesc') },
		{ value: 'points_asc', label: t('consultantsList.filters.sortPointsAsc') },
		{ value: 'name', label: t('consultantsList.filters.sortName') },
		{ value: 'last_login', label: t('consultantsList.filters.sortLastLogin') },
	];

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<div>
					<h1 className={styles.pageTitle}>{title}</h1>
					<p className={styles.subtitle}>{t('consultantsList.count', { count: total })}</p>
				</div>
				<Button variant="outlined" color="primary" size="sm" onClick={() => setShowFilters((v) => !v)}>
					<Icon name="filter" size={16} /> {t('consultantsList.filters.toggle')}
				</Button>
			</div>

			{showFilters && (
				<div className={styles.filtersBar}>
					<div className={styles.searchWrap}>
						<FilterSearchInput
							name="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t('consultantsList.filters.searchPlaceholder')}
						/>
					</div>
					{!isSll && (
						<CustomSelect name="serviceLineId" value={serviceLineId} onChange={(e) => setServiceLineId(e.target.value)}
							options={slOptions} ariaLabel={t('consultantsList.colServiceLine')} compact />
					)}
					<CustomSelect name="areaId" value={areaId} onChange={(e) => setAreaId(e.target.value)}
						options={areaOptions} ariaLabel={t('consultantsList.colArea')} compact />
					<input type="number" min="0" className={styles.pointsInput} value={pointsMin}
						onChange={(e) => setPointsMin(e.target.value)} placeholder={t('consultantsList.filters.pointsMin')} />
					<input type="number" min="0" className={styles.pointsInput} value={pointsMax}
						onChange={(e) => setPointsMax(e.target.value)} placeholder={t('consultantsList.filters.pointsMax')} />
					<CustomSelect name="sort" value={sort} onChange={(e) => setSort(e.target.value)}
						options={sortOptions} ariaLabel={t('consultantsList.filters.sort')} compact />
					<Button variant="filled" color="primary" size="sm" onClick={applyFilters}>{t('consultantsList.filters.apply')}</Button>
					<Button variant="text" color="primary" size="sm" onClick={clearFilters}>{t('consultantsList.filters.clear')}</Button>
				</div>
			)}

			<div className={styles.tableCard}>
				{loading ? (
					<TableSkeleton rows={6} columns={6} />
				) : error ? (
					<div className={styles.stateMsg}>{error}</div>
				) : rows.length === 0 ? (
					<div className={styles.stateMsg}>
						<Icon name="user" size={28} color="var(--color-outline)" />
						<span>{t('consultantsList.empty')}</span>
					</div>
				) : (
					<div className="table-responsive">
						<table className={`table align-middle mb-0 ${styles.table}`}>
							<thead>
								<tr>
									<th>{t('consultantsList.colConsultant')}</th>
									{!isSll && <th>{t('consultantsList.colServiceLine')}</th>}
									<th>{t('consultantsList.colArea')}</th>
									{isSll && <th className={styles.numCol}>{t('consultantsList.colBadgesObtained')}</th>}
									<th className={styles.numCol}>{t('consultantsList.colPoints')}</th>
									<th className={styles.numCol}>{isSll ? t('consultantsList.colOpenApps') : t('consultantsList.colApplications')}</th>
									<th>{t('consultantsList.colLastLogin')}</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.user_guid}>
										<td>
											<div className={styles.consultantCell}>
												<Avatar src={r.profile_img_url} name={r.full_name} size={28} />
												<span className={styles.consultantName}>{r.full_name || '—'}</span>
											</div>
										</td>
										{!isSll && <td className="text-muted">{r.service_line_name || '—'}</td>}
										<td className="text-muted">{r.primary_area_name || '—'}</td>
										{isSll && <td className={styles.numCol}>{r.total_badges ?? 0}</td>}
										<td className={styles.numCol}>
											<span className={styles.pointsCell}>
												<Icon name="star-points" size={14} color="var(--color-primary)" />
												{Number(r.total_points || 0).toLocaleString('pt-PT')}
											</span>
										</td>
										<td className={styles.numCol}>{isSll ? (r.open_applications_count ?? 0) : (r.applications_count ?? 0)}</td>
										<td className="text-muted">{fmtDate(r.last_login_at) || t('consultantsList.neverLoggedIn')}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{pagination && pagination.totalPages > 1 && (
					<Pagination
						currentPage={pagination.currentPage}
						totalPages={pagination.totalPages}
						totalItems={pagination.totalItems}
						itemCount={rows.length}
						onPageChange={setPage}
					/>
				)}
			</div>
		</div>
	);
}
