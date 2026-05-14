import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUsers as getUsers, createUser, updateUser, deactivateUser } from '../../../features/users/api/usersApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import UserFilters, { EMPTY_FILTERS } from '../../../components/UserFilters/UserFilters';
import Pagination from '../../../components/Pagination/Pagination';
import styles from './AdminUsers.module.css';

const ROLES = ['Administrator', 'Consultant', 'Talent Manager', 'Service Line Leader'];

// Maps each role value to a CSS module class for the coloured pill badge.
const ROLE_CLASS = {
	Administrator: styles.roleAdministrator,
	Consultant: styles.roleConsultant,
	'Talent Manager': styles.roleTalentManager,
	'Service Line Leader': styles.roleServiceLineLeader,
};

const emptyForm = {
	fullName: '',
	username: '',
	emailAddress: '',
	password: '',
	userRole: 'Consultant',
	isActive: true,
};

/** Returns up to two uppercase initials from a full name string. */
function getInitials(name = '') {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 0 || !parts[0]) return '?';
	if (parts.length === 1) return parts[0][0].toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminUsers() {
	const { t } = useTranslation();

	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [serviceLines, setServiceLines] = useState([]);
	const [areas, setAreas] = useState([]);
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState(null);

	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadHierarchy();
	}, []);

	useEffect(() => {
		loadUsers(filters, page);
	}, [filters, page]);

	async function loadUsers(activeFilters, activePage) {
		try {
			setLoading(true);
			const result = await getUsers({ filters: activeFilters, page: activePage });
			setUsers(result.data || []);
			setPagination(result.pagination || null);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	function handleFiltersChange(newFilters) {
		setFilters(newFilters);
		setPage(1);
	}

	function handleFiltersClear() {
		setFilters(EMPTY_FILTERS);
		setPage(1);
	}

	// Service lines and areas are fetched in parallel so the filter dropdowns
	// are populated without a sequential waterfall.
	async function loadHierarchy() {
		try {
			const [sl, ar] = await Promise.all([getServiceLines(), getAreas()]);
			setServiceLines(sl || []);
			setAreas(ar || []);
		} catch (err) {
			console.error(err);
		}
	}

	function openCreate() {
		setEditItem(null);
		setForm(emptyForm);
		setShowModal(true);
	}

	function openEdit(user) {
		setEditItem(user);
		setForm({
			fullName: user.full_name || user.fullName || '',
			username: user.username || '',
			emailAddress: user.email_address || user.emailAddress || '',
			userRole: user.user_role || user.userRole || 'Consultant',
			isActive: user.is_active ?? true,
		});
		setShowModal(true);
	}

	async function handleDelete(user) {
		if (!window.confirm(t('shared.confirmDeactivate', { name: user.full_name || user.fullName }))) return;
		try {
			await deactivateUser(user.user_guid || user.userGuid);
			setUsers((prev) => prev.filter((u) => u.user_guid !== user.user_guid));
		} catch (err) {
			console.error(err);
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		setSaving(true);
		try {
			if (editItem) {
				const updated = await updateUser(editItem.user_guid || editItem.userGuid, form);
				setUsers((prev) => prev.map((u) => (u.user_guid === editItem.user_guid ? updated : u)));
			} else {
				const created = await createUser(form);
				setUsers((prev) => [...prev, created]);
			}
			setShowModal(false);
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	}

	function handleChange(e) {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	}

	return (
		<div>
			{/* ── Page header ─────────────────────────────────────────────── */}
			<div className="d-flex justify-content-between align-items-start mb-4">
				<div>
					<h1 className="h3 mb-0">{t('adminUsers.title')}</h1>
					<p className={styles.headerSubtitle}>{t('adminUsers.subtitle')}</p>
				</div>
				<Button onClick={openCreate}>{t('adminUsers.newUser')}</Button>
			</div>

			{/* ── Filter bar ──────────────────────────────────────────────── */}
			<UserFilters
				filters={filters}
				onChange={handleFiltersChange}
				onClear={handleFiltersClear}
				serviceLines={serviceLines}
				areas={areas}
			/>

			{/* ── Top pagination ───────────────────────────────────────────── */}
			{!loading && pagination && pagination.totalPages > 1 && (
				<Pagination
					currentPage={page}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemCount={users.length}
					onPageChange={setPage}
				/>
			)}

			{/* ── Users table ──────────────────────────────────────────────── */}
			<div className={`card border-0 shadow-sm ${styles.tableCard}`}>
				<div className="card-body p-0">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : users.length === 0 ? (
						<div className={styles.emptyState}>
							<div className={styles.emptyIcon}>
								<Icon name="search" size={22} aria-hidden="true" />
							</div>
							<p className={styles.emptyTitle}>{t('adminUsers.noUsers')}</p>
							<p className={styles.emptyDesc}>{t('adminUsers.noUsersDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th style={{ paddingLeft: '1.25rem' }}>{t('shared.name')}</th>
										<th>{t('shared.username')}</th>
										<th>{t('shared.role')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end" style={{ paddingRight: '1.25rem' }}>{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{users.map((u) => {
										const fullName = u.full_name || u.fullName || '';
										const role = u.user_role || u.userRole || '';
										const isActive = u.is_active ?? u.isActive;

										return (
											<tr key={u.user_guid || u.userGuid}>
												{/* Name + email combined in one cell with avatar */}
												<td style={{ paddingLeft: '1.25rem' }}>
													<div className={styles.userCell}>
														<div className={styles.avatar} aria-hidden="true">
															{getInitials(fullName)}
														</div>
														<div>
															<div className={styles.userName}>{fullName}</div>
															<div className={styles.userEmail}>
																{u.email_address || u.emailAddress}
															</div>
														</div>
													</div>
												</td>

												<td className="text-muted" style={{ fontSize: '0.875rem' }}>
													{u.username}
												</td>

												{/* Coloured role pill */}
												<td>
													<span className={`${styles.roleBadge} ${ROLE_CLASS[role] ?? ''}`}>
														{role}
													</span>
												</td>

												{/* Status dot + label */}
												<td>
													<span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
														<span className={styles.statusDot} aria-hidden="true" />
														{isActive ? t('shared.active') : t('shared.inactive')}
													</span>
												</td>

												<td className="text-end" style={{ paddingRight: '1.25rem' }}>
													<Button size="sm" variant="outlined" className="me-2" title={t('shared.edit')} onClick={() => openEdit(u)}>
														<Icon name="pencil" size={14} aria-hidden="true" />
													</Button>
													<Button size="sm" variant="outlined" color="danger" title={t('shared.delete')} onClick={() => handleDelete(u)}>
														<Icon name="trash" size={14} aria-hidden="true" />
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* ── Bottom pagination ────────────────────────────────────────── */}
			{pagination && pagination.totalPages > 1 && (
				<Pagination
					currentPage={page}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalItems}
					itemCount={users.length}
					onPageChange={setPage}
				/>
			)}

			{/* ── Create / Edit modal ──────────────────────────────────────── */}
			{showModal && (
				<Modal
					title={editItem ? t('adminUsers.editUser') : t('adminUsers.newUser')}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<Button variant="outlined" onClick={() => setShowModal(false)}>
								{t('shared.cancel')}
							</Button>
							<Button loading={saving} onClick={handleSubmit}>
								{editItem ? t('shared.save') : t('shared.create')}
							</Button>
						</>
					}
				>
					<form id="user-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label={t('adminUsers.fullName')}
							name="fullName"
							value={form.fullName}
							onChange={handleChange}
							required
						/>
						<FormInput
							label={t('shared.username')}
							name="username"
							value={form.username}
							onChange={handleChange}
							required
						/>
						<FormInput
							label={t('shared.email')}
							name="emailAddress"
							type="email"
							value={form.emailAddress}
							onChange={handleChange}
							required
						/>
						{!editItem && (
							<FormInput
								label={t('shared.password')}
								name="password"
								type="password"
								value={form.password}
								onChange={handleChange}
								required={!editItem}
							/>
						)}
						<div>
							<label htmlFor="user_role" className="form-label">{t('shared.role')}</label>
							<select
								id="user_role"
								className="form-select"
								name="userRole"
								value={form.userRole}
								onChange={handleChange}
							>
								{ROLES.map((r) => (
									<option key={r} value={r}>{r}</option>
								))}
							</select>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								name="isActive"
								id="isactive"
								checked={form.isActive}
								onChange={handleChange}
							/>
							<label className="form-check-label" htmlFor="isactive">{t('shared.active')}</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
