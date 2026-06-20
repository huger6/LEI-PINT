import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../../hooks/userContext';
import {
	getAnnouncements,
	createAnnouncement,
	updateAnnouncement,
} from '../../../features/announcements/api/announcementsApi';
import { getServiceLines } from '../../../features/badges/api/hierarchyApi';
import AnnouncementFormModal from '../../../components/AnnouncementFormModal/AnnouncementFormModal';
import Modal from '../../../components/Modal/Modal';
import FilterSearchInput from '../../../components/FilterSearchInput/FilterSearchInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Pagination from '../../../components/Pagination/Pagination';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Tooltip from '../../../components/Tooltip/Tooltip';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './Announcements.module.css';

const TYPE_OPTIONS = ['Information', 'Warning', 'New Content', 'Other'];
const TYPE_CLASS_MAP = {
	'Information': 'typeInformation',
	'Warning': 'typeWarning',
	'New Content': 'typeNewContent',
	'Other': 'typeOther',
};

function formatDate(iso) {
	if (!iso) return null;
	return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Announcements({ defaultType = '' }) {
	const { t } = useTranslation();
	const { user } = useUser();
	const isAdmin = user?.role === 'Administrator';

	const [announcements, setAnnouncements] = useState([]);
	const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, currentPage: 1 });
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);

	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState(defaultType);
	const [statusFilter, setStatusFilter] = useState('');

	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [serviceLines, setServiceLines] = useState([]);
	const [confirmTarget, setConfirmTarget] = useState(null);
	const [deactivating, setDeactivating] = useState(false);

	const loadAnnouncements = useCallback(async () => {
		setLoading(true);
		try {
			const params = { page, limit: 12 };
			if (search) params.search = search;
			if (typeFilter) params.announcementType = typeFilter;
			if (statusFilter) params.isActive = statusFilter === 'active';
			const result = await getAnnouncements(params);
			setAnnouncements(result.data);
			setPagination(result.pagination);
		} catch {
			setAnnouncements([]);
		} finally {
			setLoading(false);
		}
	}, [page, search, typeFilter, statusFilter]);

	useEffect(() => {
		loadAnnouncements();
	}, [loadAnnouncements]);

	useEffect(() => {
		getServiceLines({ limit: 100 }).then(setServiceLines).catch(() => {});
	}, []);

	function handleSearchChange(e) {
		setSearch(e.target.value);
		setPage(1);
	}

	function handleTypeChange(e) {
		setTypeFilter(e.target.value);
		setPage(1);
	}

	function handleStatusChange(e) {
		setStatusFilter(e.target.value);
		setPage(1);
	}

	function openCreate() {
		setEditItem(null);
		setShowModal(true);
	}

	function openEdit(item) {
		setEditItem(item);
		setShowModal(true);
	}

	async function handleSave(payload, existing) {
		if (existing) {
			await updateAnnouncement(existing.announcement_id, payload);
		} else {
			await createAnnouncement(payload);
		}
		setShowModal(false);
		setEditItem(null);
		loadAnnouncements();
	}

	async function handleToggleActiveConfirm() {
		if (!confirmTarget) return;
		const isActive = confirmTarget.is_active;
		setDeactivating(true);
		try {
			await updateAnnouncement(confirmTarget.announcement_id, { isActive: !isActive });
			setConfirmTarget(null);
			loadAnnouncements();
		} catch (err) {
			console.error(err);
		} finally {
			setDeactivating(false);
		}
	}

	function canManage(item) {
		return isAdmin || item.creator?.user_guid === user?.guid;
	}

	function renderTarget(item) {
		if (item.is_global) return <span className={styles.targetGlobal}>{t('announcements.target.global')}</span>;

		const parts = [];
		if (item.announc_roles?.length) {
			parts.push(...item.announc_roles.map(r => r.role_name));
		}
		if (item.announc_sls?.length) {
			parts.push(...item.announc_sls.map(s => s.service_line?.service_line_name || `SL #${s.service_line_id}`));
		}
		return <span className={styles.targetList}>{parts.join(', ') || '—'}</span>;
	}

	function renderDates(item) {
		const start = formatDate(item.starts_at);
		const end = formatDate(item.ends_at);
		if (!start && !end) return <span className={styles.dateRange}>{t('announcements.noLimit')}</span>;
		return (
			<span className={styles.dateRange}>
				{start || '—'} → {end || '∞'}
			</span>
		);
	}

	const typeSelectOptions = [
		{ value: '', label: t('announcements.allTypes') },
		...TYPE_OPTIONS.map(tp => ({ value: tp, label: t(`announcements.types.${tp}`) })),
	];

	const statusSelectOptions = [
		{ value: '', label: t('announcements.allStatuses') },
		{ value: 'active', label: t('announcements.status.active') },
		{ value: 'inactive', label: t('announcements.status.inactive') },
	];

	return (
		<div className="container-fluid py-4">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h4 className="fw-bold mb-0">{t('announcements.title')}</h4>
				<Button variant="filled" onClick={openCreate}>
					<Icon name="add" size={16} aria-hidden="true" />
					<span className="ms-1">{t('announcements.createAnnouncement')}</span>
				</Button>
			</div>

			<div className={`${styles.filterRow} mb-3`}>
				<FilterSearchInput
					id="announcement-search"
					name="search"
					value={search}
					onChange={handleSearchChange}
					placeholder={t('shared.search')}
					ariaLabel={t('shared.search')}
				/>
				<div className={styles.selectWrapper}>
					<CustomSelect
						id="type-filter"
						name="typeFilter"
						value={typeFilter}
						onChange={handleTypeChange}
						options={typeSelectOptions}
						placeholder={t('announcements.filterByType')}
						ariaLabel={t('announcements.filterByType')}
						compact
					/>
				</div>
				<div className={styles.selectWrapper}>
					<CustomSelect
						id="status-filter"
						name="statusFilter"
						value={statusFilter}
						onChange={handleStatusChange}
						options={statusSelectOptions}
						placeholder={t('announcements.filterByStatus')}
						ariaLabel={t('announcements.filterByStatus')}
						compact
					/>
				</div>
			</div>

			<div className={`card border-0 shadow-sm ${styles.tableCard}`}>
				{loading ? (
					<div className="card-body p-0">
						<TableSkeleton rows={5} columns={7} />
					</div>
				) : announcements.length === 0 ? (
					<div className={styles.emptyState}>
						<div className={styles.emptyIcon}>
							<Icon name="megaphone" size={24} />
						</div>
						<p className={styles.emptyTitle}>{t('announcements.empty')}</p>
					</div>
				) : (
					<div className="table-responsive">
						<table className="table table-hover mb-0">
							<thead className="table-light">
								<tr>
									<th>{t('announcements.table.title')}</th>
									<th>{t('announcements.table.type')}</th>
									<th>{t('announcements.table.target')}</th>
									<th>{t('announcements.table.dates')}</th>
									<th>{t('announcements.table.status')}</th>
									<th>{t('announcements.table.createdBy')}</th>
									<th className="text-end">{t('announcements.table.actions')}</th>
								</tr>
							</thead>
							<tbody>
								{announcements.map(a => (
									<tr key={a.announcement_id}>
										<td>
											<span className={styles.titleCell} title={a.announcement_title}>
												{a.announcement_title}
											</span>
										</td>
										<td>
											{a.announcement_type ? (
												<span className={`${styles.typeBadge} ${styles[TYPE_CLASS_MAP[a.announcement_type]] || ''}`}>
													{t(`announcements.types.${a.announcement_type}`)}
												</span>
											) : '—'}
										</td>
										<td>{renderTarget(a)}</td>
										<td>{renderDates(a)}</td>
										<td>
											<span className={`${styles.statusBadge} ${a.is_active ? styles.statusActive : styles.statusInactive}`}>
												<span className={styles.statusDot} />
												{a.is_active ? t('announcements.status.active') : t('announcements.status.inactive')}
											</span>
										</td>
										<td>
											<span className={styles.creatorName}>
												{a.creator?.full_name || '—'}
											</span>
										</td>
										<td className="text-end">
											{canManage(a) && (
												<div className="d-inline-flex gap-1">
													<Tooltip text={t('shared.edit')}>
														<button
															type="button"
															className="btn btn-sm btn-outline-secondary border-0"
															onClick={() => openEdit(a)}
														>
															<Icon name="pencil" size={14} />
														</button>
													</Tooltip>
													{a.is_active ? (
														<Tooltip text={t('shared.deactivate')}>
															<button
																type="button"
																className="btn btn-sm btn-outline-danger border-0"
																onClick={() => setConfirmTarget(a)}
															>
																<Icon name="trash" size={14} />
															</button>
														</Tooltip>
													) : (
														<Tooltip text={t('shared.reactivate')}>
															<button
																type="button"
																className="btn btn-sm btn-outline-success border-0"
																onClick={() => setConfirmTarget(a)}
															>
																<Icon name="activate" size={14} />
															</button>
														</Tooltip>
													)}
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className="mt-3">
				<Pagination
					currentPage={page}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemCount={announcements.length}
					onPageChange={setPage}
				/>
			</div>

			{showModal && (
				<AnnouncementFormModal
					onClose={() => { setShowModal(false); setEditItem(null); }}
					onSave={handleSave}
					editItem={editItem}
					serviceLines={serviceLines}
				/>
			)}

			{confirmTarget && (() => {
				const targetActive = confirmTarget.is_active;
				return (
					<Modal
						title={targetActive ? t('shared.deactivate') : t('shared.reactivate')}
						size="sm"
						onClose={() => !deactivating && setConfirmTarget(null)}
						footer={
							<>
								<Button variant="outlined" onClick={() => setConfirmTarget(null)} disabled={deactivating}>
									{t('shared.cancel')}
								</Button>
								<Button
									variant="filled"
									color={targetActive ? 'danger' : 'success'}
									onClick={handleToggleActiveConfirm}
									loading={deactivating}
								>
									{targetActive ? t('shared.deactivate') : t('shared.reactivate')}
								</Button>
							</>
						}
					>
						<p className="mb-0">
							{targetActive
								? t('shared.confirmDeactivate', { name: confirmTarget.announcement_title })
								: t('shared.confirmReactivate', { name: confirmTarget.announcement_title })
							}
						</p>
					</Modal>
				);
			})()}
		</div>
	);
}

Announcements.propTypes = {
	// Pre-selects the type filter (e.g. "Warning" for the admin Avisos page).
	defaultType: PropTypes.string,
};
