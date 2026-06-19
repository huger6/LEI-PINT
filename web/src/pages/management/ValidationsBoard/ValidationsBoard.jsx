import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Button from '../../../components/Button/Button';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import Pagination from '../../../components/Pagination/Pagination';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import styles from './ValidationsBoard.module.css';

const PAGE_SIZE = 12;

// Maps a workflow state to a display pill (label key + style).
function statePill(state) {
	if (state === 'Accepted') return { key: 'approved', cls: styles.pillApproved };
	if (state === 'Rejected') return { key: 'rejected', cls: styles.pillRejected };
	if (state === 'Open') return { key: 'open', cls: styles.pillOpen };
	return { key: 'pending', cls: styles.pillPending }; // Submitted / In validation
}

export default function ValidationsBoard() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';
	const isAdmin = user?.role === 'Administrator';

	const [items, setItems] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);

	const [showFilters, setShowFilters] = useState(false);
	const [search, setSearch] = useState('');
	// Default to the applications this reviewer must act on (TM: Submitted,
	// SLL: In validation); the Administrator oversees everything so defaults to
	// all states. The filter lets them switch freely.
	const [stateFilter, setStateFilter] = useState(isAdmin ? '' : (isSll ? 'In validation' : 'Submitted'));
	const [sortKey, setSortKey] = useState('submitted');
	const [sortDir, setSortDir] = useState('desc');

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { data, pagination: pag } = await getApplicationsPaged({
				...(stateFilter ? { state: stateFilter } : {}),
				page,
				limit: PAGE_SIZE,
			});
			setItems(data);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [page, stateFilter]);

	useEffect(() => { load(); }, [load]);

	// Near real-time: refresh when the tab regains focus, and poll every 2 minutes.
	useEffect(() => {
		function onVisible() {
			if (document.visibilityState === 'visible') load();
		}
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', onVisible);
		const interval = setInterval(() => {
			if (document.visibilityState === 'visible') load();
		}, 120000);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', onVisible);
			clearInterval(interval);
		};
	}, [load]);

	const stateOptions = useMemo(() => [
		{ value: '', label: t('tmValidations.filters.allStates') },
		{ value: 'Submitted', label: t('tmValidations.tabs.submitted') },
		{ value: 'In validation', label: t('tmValidations.tabs.inValidation') },
		{ value: 'Accepted', label: t('tmValidations.tabs.accepted') },
		{ value: 'Rejected', label: t('tmValidations.tabs.rejected') },
	], [t]);

	// Column definitions (Service Line hidden for SLL — it's always their own).
	const columns = useMemo(() => {
		const accessors = {
			consultant: (a) => a.user?.user?.full_name || '',
			badge: (a) => a.badge?.badge_title || '',
			service_line: (a) => a.badge?.service_line?.service_line_name || '',
			area: (a) => a.badge?.area?.area_name || '',
			submitted: (a) => new Date(a.submitted_at || a.opened_at || 0).getTime(),
			state: (a) => a.application_state || '',
		};
		const base = [
			{ key: 'consultant', labelKey: 'tmValidations.cols.consultant' },
			{ key: 'badge', labelKey: 'tmValidations.cols.badge' },
			{ key: 'service_line', labelKey: 'tmValidations.cols.serviceLine' },
			{ key: 'area', labelKey: 'tmValidations.cols.area' },
			{ key: 'submitted', labelKey: 'tmValidations.cols.submittedAt' },
			{ key: 'state', labelKey: 'tmValidations.cols.state' },
		].filter((c) => !(isSll && c.key === 'service_line'));
		return base.map((c) => ({ ...c, accessor: accessors[c.key] }));
	}, [isSll]);

	const rows = useMemo(() => {
		const term = search.trim().toLowerCase();
		const accessor = columns.find((c) => c.key === sortKey)?.accessor;
		const filtered = !term ? items : items.filter((a) => {
			const badge = (a.badge?.badge_title || '').toLowerCase();
			const consultant = (a.user?.user?.full_name || '').toLowerCase();
			return badge.includes(term) || consultant.includes(term);
		});
		if (!accessor) return filtered;
		return [...filtered].sort((a, b) => {
			const va = accessor(a);
			const vb = accessor(b);
			const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
			return sortDir === 'asc' ? cmp : -cmp;
		});
	}, [items, search, sortKey, sortDir, columns]);

	function toggleSort(key) {
		if (sortKey === key) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortDir('asc');
		}
	}

	function handleStateFilter(e) {
		setStateFilter(e.target.value);
		setPage(1);
	}

	function formatDate(a) {
		const d = a.submitted_at || a.opened_at;
		return d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
	}

	const total = pagination?.total ?? items.length;

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<div>
					<h1 className={styles.pageTitle}>{t('tmValidations.boardTitle')}</h1>
					<p className={styles.subtitle}>{t('tmValidations.registered', { count: total })}</p>
				</div>
				<Button
					variant="text"
					color="primary"
					size="sm"
					onClick={() => setShowFilters((v) => !v)}
				>
					<Icon name="filter" size={16} /> {t('tmValidations.filtersBtn')}
				</Button>
			</div>

			{showFilters && (
				<div className={styles.filtersBar}>
					<div className={styles.searchWrap}>
						<FilterSearchInput
							name="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t('tmValidations.searchPlaceholder')}
							ariaLabel={t('tmValidations.searchPlaceholder')}
						/>
					</div>
					<CustomSelect
						name="stateFilter"
						value={stateFilter}
						onChange={handleStateFilter}
						options={stateOptions}
						ariaLabel={t('tmValidations.cols.state')}
					/>
				</div>
			)}

			<div className={styles.tableCard}>
				{loading ? (
					<TableSkeleton rows={6} columns={columns.length} />
				) : error ? (
					<div className={styles.stateMsg}>{error}</div>
				) : rows.length === 0 ? (
					<div className={styles.stateMsg}>
						<Icon name="check_circle" size={28} color="var(--color-outline)" />
						<p>{t('tmValidations.empty')}</p>
					</div>
				) : (
					<div className="table-responsive">
						<table className={`table align-middle mb-0 ${styles.table}`}>
							<thead>
								<tr>
									{columns.map((c) => {
										const active = sortKey === c.key;
										return (
											<th key={c.key}>
												<button type="button" className={styles.sortHeader} onClick={() => toggleSort(c.key)}>
													{t(c.labelKey)}
													<Icon
														name={active ? (sortDir === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down') : 'keyboard_arrow_down'}
														size={14}
														color={active ? 'var(--color-secondary)' : 'var(--color-outline-variant)'}
													/>
												</button>
											</th>
										);
									})}
								</tr>
							</thead>
							<tbody>
								{rows.map((a) => {
									const guid = a.application_guid;
									const pill = statePill(a.application_state);
									return (
										<tr key={guid} className={styles.row} onClick={() => navigate(`/applications/${guid}`)}>
											<td>
												<div className={styles.consultantCell}>
													<Avatar src={a.user?.user?.profile_img_url} name={a.user?.user?.full_name} size={28} />
													<span className={styles.consultantName}>{a.user?.user?.full_name || '—'}</span>
												</div>
											</td>
											<td>{a.badge?.badge_title || '—'}</td>
											{!isSll && <td className="text-muted">{a.badge?.service_line?.service_line_name || '—'}</td>}
											<td className="text-muted">{a.badge?.area?.area_name || '—'}</td>
											<td className="text-muted">
												<span className={styles.dateCell}>{formatDate(a)}</span>
											</td>
											<td>
												<span className={`${styles.pill} ${pill.cls}`}>
													<span className={styles.pillDot} />
													{t(`tmValidations.states.${pill.key}`)}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{pagination && pagination.totalPages > 1 && (
				<Pagination
					currentPage={pagination.page}
					totalPages={pagination.totalPages}
					totalItems={pagination.total}
					itemCount={items.length}
					onPageChange={setPage}
				/>
			)}
		</div>
	);
}
