import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deactivateUser } from '../../services/adminService';
import Modal from '../../components/Modal/Modal';
import FormButton from '../../components/FormButton/FormButton';
import FormInput from '../../components/FormInput/FormInput';

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
			console.error('Erro ao carregar utilizadores:', err);
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
		if (!window.confirm(`Tem certeza que deseja desativar "${user.full_name || user.fullName}"?`)) return;
		try {
			await deactivateUser(user.user_guid || user.userGuid);
			setUsers((prev) => prev.filter((u) => u.user_guid !== user.user_guid));
		} catch (err) {
			console.error('Erro ao desativar utilizador:', err);
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
			console.error('Erro ao guardar utilizador:', err);
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
				<h1 className="h3 mb-0">Utilizadores</h1>
				<FormButton variant="primary" onClick={openCreate} className="w-auto">
					Novo Utilizador
				</FormButton>
			</div>

			<div className="card border-0 shadow-sm mb-3">
				<div className="card-body d-flex align-items-center gap-3">
					<label htmlFor="role_filter" className="form-label mb-0 text-nowrap small">Filtrar por role:</label>
					<select
						id="role_filter"
						className="form-select form-select-sm"
						style={{ maxWidth: 220 }}
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
					>
						<option value="">Todos</option>
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
							<h5 className="text-muted">Sem utilizadores</h5>
							<p className="text-muted small">Nenhum utilizador encontrado.</p>
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>Nome</th>
										<th>Username</th>
										<th>Email</th>
										<th>Role</th>
										<th>Ativo</th>
										<th className="text-end">Ações</th>
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
													{u.is_active ? 'Sim' : 'Não'}
												</span>
											</td>
											<td className="text-end">
												<button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEdit(u)}>
													<i className="bi bi-pencil" />
												</button>
												<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)}>
													<i className="bi bi-trash" />
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
					title={editItem ? 'Editar Utilizador' : 'Novo Utilizador'}
					onClose={() => setShowModal(false)}
					footer={
						<>
							<FormButton variant="ghost" onClick={() => setShowModal(false)} className="w-auto">
								Cancelar
							</FormButton>
							<FormButton variant="primary" loading={saving} onClick={handleSubmit} className="w-auto">
								{editItem ? 'Guardar' : 'Criar'}
							</FormButton>
						</>
					}
				>
					<form id="user-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
						<FormInput
							label="Nome Completo"
							name="fullName"
							value={form.fullName}
							onChange={handleChange}
							required
						/>
						<FormInput
							label="Username"
							name="username"
							value={form.username}
							onChange={handleChange}
							required
						/>
						<FormInput
							label="Email"
							name="emailAddress"
							type="email"
							value={form.emailAddress}
							onChange={handleChange}
							required
						/>
						{!editItem && (
							<FormInput
								label="Password"
								name="password"
								type="password"
								value={form.password}
								onChange={handleChange}
								required={!editItem}
							/>
						)}
						<div>
							<label htmlFor="user_role" className="form-label">Role</label>
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
							<label className="form-check-label" htmlFor="isactive">Ativo</label>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
