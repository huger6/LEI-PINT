import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRanking } from '../../../services/pointsService';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import Avatar from '../../../components/Avatar/Avatar';
import Pagination from '../../../components/Pagination/Pagination';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Icon from '../../../components/Icons/Icons';
import styles from './ConsultantsList.module.css';

const PAGE_SIZE = 12;

/**
 * Role-aware consultants overview (progress = points + badges), backed by the
 * ranking endpoint. Talent Manager sees all consultants; Service Line Leader is
 * scoped to their own Service Line. Rendered by TmConsultants and SllTeam.
 */
export default function ConsultantsList() {
	const { t } = useTranslation();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';

	const [scopeReady, setScopeReady] = useState(false);
	const [slId, setSlId] = useState(null);
	const [scopeError, setScopeError] = useState('');

	const [rows, setRows] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Resolve the SLL's Service Line id (TM needs no scope).
	useEffect(() => {
		let active = true;
		if (!isSll) {
			setScopeReady(true);
			return undefined;
		}
		(async () => {
			try {
				const sls = await getServiceLines();
				if (!active) return;
				const slug = user?.serviceLine?.slug;
				const matched = (sls || []).find((sl) => sl.sl_slug === slug);
				if (matched) {
					setSlId(String(matched.service_line_id));
				} else {
					setScopeError(resolveErrorMessage({ code: 'APP_ACCESS_DENIED_SL' }));
				}
			} catch (err) {
				if (active) setScopeError(resolveErrorMessage(err));
			} finally {
				if (active) setScopeReady(true);
			}
		})();
		return () => { active = false; };
	}, [isSll, user]);

	const load = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const params = { page, limit: PAGE_SIZE };
			if (isSll) params.serviceLineId = slId;
			const { rankings, pagination: pag } = await getRanking(params);
			setRows(rankings);
			setPagination(pag);
		} catch (err) {
			setError(resolveErrorMessage(err));
			setRows([]);
			setPagination(null);
		} finally {
			setLoading(false);
		}
	}, [page, isSll, slId]);

	useEffect(() => {
		if (!scopeReady) return;
		if (isSll && !slId) { setLoading(false); return; }
		load();
	}, [scopeReady, slId, isSll, load]);

	const total = pagination?.totalItems ?? rows.length;
	const title = isSll ? t('consultantsList.teamTitle') : t('consultantsList.title');

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<h1 className={styles.pageTitle}>{title}</h1>
				<p className={styles.subtitle}>{t('consultantsList.count', { count: total })}</p>
			</div>

			<div className={styles.tableCard}>
				{!scopeReady || loading ? (
					<TableSkeleton rows={6} columns={5} />
				) : scopeError ? (
					<div className={styles.stateMsg}>{scopeError}</div>
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
									<th className={styles.posCol}>#</th>
									<th>{t('consultantsList.colConsultant')}</th>
									<th>{t('consultantsList.colArea')}</th>
									<th className={styles.numCol}>{t('consultantsList.colPoints')}</th>
									<th className={styles.numCol}>{t('consultantsList.colBadges')}</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r, i) => {
									const position = (page - 1) * PAGE_SIZE + i + 1;
									return (
										<tr key={r.user_guid} className={styles.row}>
											<td className={styles.posCol}>
												<span className={styles.posBadge}>#{position}</span>
											</td>
											<td>
												<div className={styles.consultantCell}>
													<Avatar src={r.profile_img_url} name={r.full_name} size={28} />
													<span className={styles.consultantName}>{r.full_name || '—'}</span>
												</div>
											</td>
											<td className="text-muted">{r.primary_area_name || '—'}</td>
											<td className={styles.numCol}>
												<span className={styles.pointsCell}>
													<Icon name="star-points" size={14} color="var(--color-primary)" />
													{Number(r.total_points || 0).toLocaleString('pt-PT')}
												</span>
											</td>
											<td className={styles.numCol}>{r.total_badges ?? 0}</td>
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
