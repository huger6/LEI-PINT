import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, createUser, updateUser, deactivateUser } from '../../../services/adminService';
import Modal from '../../../components/Modal/Modal';
import FormButton from '../../../components/FormButton/FormButton';
import FormInput from '../../../components/FormInput/FormInput';
import Icon from '../../../components/Icons/Icons';
import styles from './AdminUsers.module.css';

const ROLES = ['Administrator', 'Consultant', 'Talent Manager', 'Service Line Leader'];

const emptyForm = {
	fullName: '',
	username: '',
	emailAddress: '',
	password: '',
	userRole: 'Consultant',
	isActive: true,
};

export default function AdminUsers() {
	const { t } = useTranslation();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [roleFilter, setRoleFilter] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadUsers();
	}, []);

	async function loadUsers() {
		try {
			setLoading(true);
			const data = await getUsers();
			setUsers(data.data || data || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
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

	const filtered = roleFilter ? users.filter((u) => (u.user_role || u.userRole) === roleFilter) : users;

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="h3 mb-0">{t('adminUsers.title')}</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					{t('adminUsers.newUser')}
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm mb-3">
				<div className="card-body d-flex align-items-center gap-3">
					<label htmlFor="role_filter" className="form-label mb-0 text-nowrap small">{t('adminUsers.filterByRole')}</label>
					<select
						id="role_filter"
						className={`form-select form-select-sm ${styles.roleFilter}`}
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<option value="">{t('shared.all')}</option>
						{ROLES.map((r) => (
							<option key={r} value={r}>{r}</option>
						))}
					</select>
				</div>
			</div>

			<div className="card border-0 shadow-sm">
				<div className="card-body">
					{loading ? (
						<div className="text-center py-5">
							<div className="spinner-border text-primary" role="status" />
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-5">
							<h5 className="text-muted">{t('adminUsers.noUsers')}</h5>
							<p className="text-muted small">{t('adminUsers.noUsersDesc')}</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>{t('shared.name')}</th>
										<th>{t('shared.username')}</th>
										<th>{t('shared.email')}</th>
										<th>{t('shared.role')}</th>
										<th>{t('shared.active')}</th>
										<th className="text-end">{t('shared.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((u) => (
										<tr key={u.user_guid || u.userGuid}>
											<td>{u.full_name || u.fullName}</td>
											<td>{u.username}</td>
											<td>{u.email_address || u.emailAddress}</td>
											<td>
												<span className="badge bg-primary">{u.user_role || u.userRole}</span>
											</td>
											<td>
												<span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
													{u.is_active ? t('shared.yes') : t('shared.no')}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(u)}>
													<Icon name="pencil" size={14} aria-hidden="true" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)}>
													<Icon name="trash" size={14} aria-hidden="true" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{showModal && (
				<Modal
					title={editItem ? t('adminUsers.editUser') : t('adminUsers.newUser')}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<FormButton variant="ghost" onClick={() => setShowModal(false)} className="w-auto">
								{t('shared.cancel')}
							</FormButton>
							<FormButton variant="primary" loading={saving} onClick={handleSubmit} className="w-auto">
								{editItem ? t('shared.save') : t('shared.create')}
							</FormButton>
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
