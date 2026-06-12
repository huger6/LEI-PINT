import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Avatar from '../../../components/Avatar/Avatar';
import Pagination from '../../../components/Pagination/Pagination';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Icon from '../../../components/Icons/Icons';
import styles from './SllBadgeHistory.module.css';

const PAGE_SIZE = 12;

// History lenses: obtained badges vs in-process applications vs everything.
const FILTERS = {
	obtained: ['Accepted'],
	inprocess: ['Open', 'Submitted', 'In validation'],
	all: null,
};

function statePill(state) {
	if (state === 'Accepted') return { key: 'approved', cls: styles.pillApproved };
	if (state === 'Rejected') return { key: 'rejected', cls: styles.pillRejected };
	if (state === 'Open') return { key: 'open', cls: styles.pillOpen };
	return { key: 'pending', cls: styles.pillPending }; // Submitted / In validation
}

const APP_STATE_KEY = {
	Open: 'open',
	Submitted: 'submitted',
	'In validation': 'inValidation',
	Accepted: 'accepted',
	Rejected: 'rejected',
};

/**
 * Service Line Leader: history of badges in their Service Line (obtained and
 * in-process). Backed by getApplications, which the API auto-scopes by role to
 * the leader's Service Line.
 */
export default function SllBadgeHistory() {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('obtained');
	const [rows, setRows] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const states = FILTERS[filter];
			const { data, pagination: pag } = await getApplicationsPaged({
				...(states ? { state: states } : {}),
				page,
				limit: PAGE_SIZE,
			});
			setRows(data);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setRows([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	}, [filter, page]);

	useEffect(() => { load(); }, [load]);

	function changeFilter(next) {
		setFilter(next);
		setPage(1);
	}

	const total = pagination?.totalItems ?? rows.length;

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<div>
					<h1 className={styles.pageTitle}>{t('sllBadgeHistory.title')}</h1>
					<p className={styles.subtitle}>{t('sllBadgeHistory.count', { count: total })}</p>
				</div>
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
			</div>

			<div className={styles.tableCard}>
				{loading ? (
					<TableSkeleton rows={6} columns={5} />
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
									<th>{t('sllBadgeHistory.colState')}</th>
									<th>{t('sllBadgeHistory.colDate')}</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((a) => {
									const pill = statePill(a.application_state);
									const date = a.validated_at || a.submitted_at || a.opened_at;
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
											<td>
												<span className={`${styles.pill} ${pill.cls}`}>
													<span className={styles.pillDot} />
													{t(`applicationReview.appState.${APP_STATE_KEY[a.application_state] || 'pending'}`, { defaultValue: a.application_state })}
												</span>
											</td>
											<td className="text-muted">
												<span className={styles.dateCell}>
													<Icon name="clock" size={14} color="var(--color-outline)" />
													{date ? new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
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
