import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getConsultantsOverview } from '../../../features/statistics/api/statisticsApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import { TM, SLL, SHARED } from '../../../routes/paths';
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

const PAGE_SIZE = 20;
const MAX_POINTS = 2000;
const EMPTY_APPLIED = { search: '', serviceLineId: '', areaId: '', pointsMin: '', pointsMax: '', sort: 'points_desc' };

// Format a date as a short localized pt-PT string, or null when absent.
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null);

/**
 * Role-aware consultants overview backed by GET /statistics/consultants
 * (SLL scoped server-side to their Service Line). Talent Manager and Service
 * Line Leader get the columns and filters defined in the Figma designs.
 */
export default function ConsultantsList() {
	// Access translation function.
	const { t } = useTranslation();
	// Allow programmatic navigation to consultant detail.
	const navigate = useNavigate();
	// Retrieve the current authenticated user.
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';
	const detailBase = isSll ? SLL.TEAM : TM.CONSULTANTS;

	// Store the consultant rows returned from the API.
	const [rows, setRows] = useState([]);
	// Store pagination metadata from the API.
	const [pagination, setPagination] = useState(null);
	// Track the current page number.
	const [page, setPage] = useState(1);
	// Track whether the consultant list is loading.
	const [loading, setLoading] = useState(true);
	// Store any error message from the data fetch.
	const [error, setError] = useState('');

	// Control visibility of the filter panel.
	const [showFilters, setShowFilters] = useState(false);
	// Store the search input value.
	const [search, setSearch] = useState('');
	// Store the selected service line filter ID.
	const [serviceLineId, setServiceLineId] = useState('');
	// Store the selected area filter ID.
	const [areaId, setAreaId] = useState('');
	// Store the minimum points range value.
	const [pointsMin, setPointsMin] = useState('');
	// Store the maximum points range value.
	const [pointsMax, setPointsMax] = useState('');
	// Store the current sort key selection.
	const [sort, setSort] = useState('points_desc');
	// Filters apply only on "Aplicar" (or page change), not on every keystroke/tick.
	const [applied, setApplied] = useState(EMPTY_APPLIED);

	// Store the list of service lines for filter options.
	const [serviceLines, setServiceLines] = useState([]);
	// Store the list of areas for filter options.
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

	// Fetch the consultants list with applied filters and pagination params.
	const load = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const params = { page, limit: PAGE_SIZE, sort: applied.sort };
			if (applied.search.trim()) params.search = applied.search.trim();
			if (!isSll && applied.serviceLineId) params.serviceLineId = applied.serviceLineId;
			if (applied.areaId) params.areaId = applied.areaId;
			if (applied.pointsMin !== '') params.pointsMin = applied.pointsMin;
			if (applied.pointsMax !== '') params.pointsMax = applied.pointsMax;
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
	}, [page, applied, isSll]);

	// Re-fetch the list whenever filters or page changes.
	useEffect(() => { load(); }, [load]);

	// Apply the current filter form values and reset to page 1.
	function applyFilters() {
		setApplied({ search, serviceLineId, areaId, pointsMin, pointsMax, sort });
		setPage(1);
	}

	// Reset all filter fields and applied state to defaults.
	function clearFilters() {
		setSearch('');
		setServiceLineId('');
		setAreaId('');
		setPointsMin('');
		setPointsMax('');
		setSort('points_desc');
		setApplied(EMPTY_APPLIED);
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
				<Button variant="text" color="primary" size="sm" onClick={() => setShowFilters((v) => !v)}>
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
							options={slOptions} ariaLabel={t('consultantsList.colServiceLine')} />
					)}
					<CustomSelect name="areaId" value={areaId} onChange={(e) => setAreaId(e.target.value)}
						options={areaOptions} ariaLabel={t('consultantsList.colArea')} />
					<div className={styles.pointsField}>
						<label className={styles.pointsLabel}>{t('consultantsList.filters.pointsMin')}: <b>{pointsMin === '' ? 0 : pointsMin}</b></label>
						<input type="range" min="0" max={MAX_POINTS} step="50" className={`form-range ${styles.pointsRange}`}
							value={pointsMin === '' ? 0 : pointsMin}
							onChange={(e) => {
								const v = Number(e.target.value);
								setPointsMin(String(v));
								if (pointsMax !== '' && v > Number(pointsMax)) setPointsMax(String(v));
							}} />
					</div>
					<div className={styles.pointsField}>
						<label className={styles.pointsLabel}>{t('consultantsList.filters.pointsMax')}: <b>{pointsMax === '' ? MAX_POINTS : pointsMax}</b></label>
						<input type="range" min="0" max={MAX_POINTS} step="50" className={`form-range ${styles.pointsRange}`}
							value={pointsMax === '' ? MAX_POINTS : pointsMax}
							onChange={(e) => {
								const v = Number(e.target.value);
								setPointsMax(String(v));
								if (pointsMin !== '' && v < Number(pointsMin)) setPointsMin(String(v));
							}} />
					</div>
					<CustomSelect name="sort" value={sort} onChange={(e) => setSort(e.target.value)}
						options={sortOptions} ariaLabel={t('consultantsList.filters.sort')} />
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
									<tr key={r.user_guid} className={styles.row} onClick={() => navigate(`${detailBase}/${r.user_guid}`)}>
										<td>
											<button
												type="button"
												className={styles.consultantCell}
												title={t('consultantsList.viewPublicProfile', { defaultValue: 'Ver perfil público' })}
												onClick={(e) => { e.stopPropagation(); navigate(SHARED.USER_PROFILE_VIEW.replace(':guid', r.user_guid)); }}
											>
												<Avatar src={r.profile_img_url} name={r.full_name} size={28} />
												<span className={styles.consultantName}>{r.full_name || '—'}</span>
											</button>
										</td>
										{!isSll && <td className="text-muted">{r.service_line_name || '—'}</td>}
										<td className="text-muted">{r.primary_area_name || '—'}</td>
										{isSll && <td className={styles.numCol}>{r.total_badges ?? 0}</td>}
										<td className={styles.numCol}>{Number(r.total_points || 0).toLocaleString('pt-PT')}</td>
										<td className={styles.numCol}>{isSll ? (r.open_applications_count ?? 0) : (r.applications_count ?? 0)}</td>
										<td className="text-muted">{fmtDate(r.last_login_at) || t('consultantsList.neverLoggedIn')}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{pagination && pagination.totalPages > 1 && (
					<div className={styles.paginationWrap}>
						<Pagination
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							totalItems={pagination.totalItems}
							itemCount={rows.length}
							onPageChange={setPage}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
