import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { getAreas, getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { getBadges } from '../../../features/badges/api/badgesApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Avatar from '../../../components/Avatar/Avatar';
import Pagination from '../../../components/Pagination/Pagination';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import DatePicker from '../../../components/DatePicker/DatePicker';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './SllBadgeHistory.module.css';

const PAGE_SIZE = 12;

// Two lenses per the Figma design: obtained badges vs in-process applications.
const FILTERS = {
	obtained: ['Accepted'],
	inprocess: ['Open', 'Submitted', 'In validation'],
};

function statePill(state) {
	if (state === 'Accepted') return { cls: styles.pillApproved };
	if (state === 'Rejected') return { cls: styles.pillRejected };
	if (state === 'Open') return { cls: styles.pillOpen };
	return { cls: styles.pillPending }; // Submitted / In validation
}

const APP_STATE_KEY = {
	Open: 'open',
	Submitted: 'submitted',
	'In validation': 'inValidation',
	Accepted: 'accepted',
	Rejected: 'rejected',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/**
 * Service Line Leader: history of badges in their Service Line (obtained vs
 * in-process). Backed by getApplications (auto-scoped by role to the leader's
 * Service Line), with area / badge / date filters.
 */
export default function SllBadgeHistory() {
	const { t } = useTranslation();
	const { user } = useUser();
	const [filter, setFilter] = useState('obtained');
	const [rows, setRows] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Filters
	const [showFilters, setShowFilters] = useState(false);
	const [areaId, setAreaId] = useState('');
	const [badgeId, setBadgeId] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [areas, setAreas] = useState([]);
	const [badges, setBadges] = useState([]);

	// Filter options scoped to the leader's Service Line (so picking one always
	// matches data within their scope).
	useEffect(() => {
		let active = true;
		(async () => {
			const [sls, ars, bds] = await Promise.all([
				getServiceLines().catch(() => []),
				getAreas().catch(() => []),
				getBadges({ limit: 200 }).catch(() => []),
			]);
			if (!active) return;
			const matchedSl = (sls || []).find((sl) => sl.sl_slug === user?.serviceLine?.slug);
			const slId = matchedSl ? matchedSl.service_line_id : null;
			const badgeList = Array.isArray(bds) ? bds : (bds?.data || []);
			if (slId) {
				setAreas((ars || []).filter((a) => String(a.service_line_id) === String(slId)));
				setBadges(badgeList.filter((b) => String(b.service_line_id) === String(slId)));
			} else {
				setAreas(ars || []);
				setBadges(badgeList);
			}
		})();
		return () => { active = false; };
	}, [user]);

	const load = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const params = { state: FILTERS[filter], page, limit: PAGE_SIZE };
			if (areaId) params.areaId = areaId;
			if (badgeId) params.badgeId = badgeId;
			if (dateFrom) params.dateFrom = dateFrom;
			if (dateTo) params.dateTo = dateTo;
			const { data, pagination: pag } = await getApplicationsPaged(params);
			setRows(data);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setRows([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	}, [filter, page, areaId, badgeId, dateFrom, dateTo]);

	useEffect(() => { load(); }, [load]);

	function changeFilter(next) {
		setFilter(next);
		setPage(1);
	}

	function clearFilters() {
		setAreaId('');
		setBadgeId('');
		setDateFrom('');
		setDateTo('');
		setPage(1);
	}

	const total = pagination?.totalItems ?? rows.length;

	const areaOptions = [{ value: '', label: t('sllBadgeHistory.filters.allAreas') },
		...areas.map((a) => ({ value: String(a.area_id), label: a.area_name }))];
	const badgeOptions = [{ value: '', label: t('sllBadgeHistory.filters.allBadges') },
		...badges.map((b) => ({ value: String(b.badge_id), label: b.badge_title }))];

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<div>
					<h1 className={styles.pageTitle}>{t('sllBadgeHistory.title')}</h1>
					<p className={styles.subtitle}>{t('sllBadgeHistory.count', { count: total })}</p>
				</div>
				<div className={styles.headerActions}>
					<div className={styles.segmented} role="tablist">
						{Object.keys(FILTERS).map((key) => (
							<button
								key={key}
								type="button"
								role="tab"
								aria-selected={filter === key}
								className={`${styles.segBtn} ${filter === key ? styles.segActive : ''}`}
								onClick={() => changeFilter(key)}
							>
								{t(`sllBadgeHistory.filter.${key}`)}
							</button>
						))}
					</div>
					<Button variant="text" color="primary" size="sm" onClick={() => setShowFilters((v) => !v)}>
						<Icon name="filter" size={16} /> {t('sllBadgeHistory.filters.toggle')}
					</Button>
				</div>
			</div>

			{showFilters && (
				<div className={styles.filtersBar}>
					<CustomSelect name="areaId" value={areaId} onChange={(e) => setAreaId(e.target.value)}
						options={areaOptions} ariaLabel={t('sllBadgeHistory.colArea')} />
					<CustomSelect name="badgeId" value={badgeId} onChange={(e) => setBadgeId(e.target.value)}
						options={badgeOptions} ariaLabel={t('sllBadgeHistory.colBadge')} />
					<label className={styles.dateField}>
						<span>{t('sllBadgeHistory.filters.from')}</span>
						<DatePicker name="dateFrom" value={dateFrom} max={dateTo || undefined}
							onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} ariaLabel={t('sllBadgeHistory.filters.from')} />
					</label>
					<label className={styles.dateField}>
						<span>{t('sllBadgeHistory.filters.to')}</span>
						<DatePicker name="dateTo" value={dateTo} min={dateFrom || undefined}
							onChange={(e) => { setDateTo(e.target.value); setPage(1); }} ariaLabel={t('sllBadgeHistory.filters.to')} />
					</label>
					<Button variant="text" color="primary" size="sm" onClick={clearFilters}>{t('sllBadgeHistory.filters.clear')}</Button>
				</div>
			)}

			<div className={styles.tableCard}>
				{loading ? (
					<TableSkeleton rows={6} columns={6} />
				) : error ? (
					<div className={styles.stateMsg}>{error}</div>
				) : rows.length === 0 ? (
					<div className={styles.stateMsg}>
						<Icon name="time" size={28} color="var(--color-outline)" />
						<span>{t('sllBadgeHistory.empty')}</span>
					</div>
				) : (
					<div className="table-responsive">
						<table className={`table align-middle mb-0 ${styles.table}`}>
							<thead>
								<tr>
									<th>{t('sllBadgeHistory.colConsultant')}</th>
									<th>{t('sllBadgeHistory.colBadge')}</th>
									<th>{t('sllBadgeHistory.colArea')}</th>
									<th>{t('sllBadgeHistory.colLevel')}</th>
									<th>{t('sllBadgeHistory.colObtainedDate')}</th>
									<th>{t('sllBadgeHistory.colState')}</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((a) => {
									const pill = statePill(a.application_state);
									const date = a.validated_at || a.submitted_at || a.opened_at;
									const stage = a.badge?.progression_stage;
									const level = stage?.stage_code?.stage_code || stage?.stage_title || '—';
									return (
										<tr key={a.application_guid}>
											<td>
												<div className={styles.consultantCell}>
													<Avatar src={a.user?.user?.profile_img_url} name={a.user?.user?.full_name} size={28} />
													<span className={styles.consultantName}>{a.user?.user?.full_name || '—'}</span>
												</div>
											</td>
											<td>{a.badge?.badge_title || '—'}</td>
											<td className="text-muted">{a.badge?.area?.area_name || '—'}</td>
											<td><span className={styles.levelChip}>{level}</span></td>
											<td className="text-muted">
												<span className={styles.dateCell}>
													<Icon name="clock" size={14} color="var(--color-outline)" />
													{fmtDate(date)}
												</span>
											</td>
											<td>
												<span className={`${styles.pill} ${pill.cls}`}>
													<span className={styles.pillDot} />
													{t(`applicationReview.appState.${APP_STATE_KEY[a.application_state] || 'pending'}`, { defaultValue: a.application_state })}
												</span>
											</td>
										</tr>
									);
								})}
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
