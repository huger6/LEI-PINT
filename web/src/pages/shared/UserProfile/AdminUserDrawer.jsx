import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateUser } from '../../../features/users/api/usersApi';
import { getServiceLines, getAreas } from '../../../features/badges/api/hierarchyApi';
import api from '../../../services/api';
import {
	useAvailability,
	AVAILABILITY_STATUS,
	isCheckBlocking,
	fetchUsernameAvailability,
	fetchEmailAvailability,
} from '../../../validations';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import AreaPickerList from '../../../components/AreaPickerList/AreaPickerList';
import ConfirmToast from '../../../components/ConfirmToast/ConfirmToast';
import { ADMIN } from '../../../routes/paths';
import styles from './AdminUserDrawer.module.css';

const CHANGEABLE_ROLES = ['Consultant', 'Talent Manager', 'Service Line Leader'];

function DetailRow({ label, children }) {
	return (
		<div className={styles.detailRow}>
			<span className={styles.detailLabel}>{label}</span>
			<span className={styles.detailValue}>{children}</span>
		</div>
	);
}

export default function AdminUserDrawer({ open, onClose, onSaved, profile, guid }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const panelRef = useRef(null);

	const [form, setForm] = useState({});
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const initialRef = useRef({});

	const [serviceLines, setServiceLines] = useState([]);
	const [allAreas, setAllAreas] = useState([]);
	const [showSllWarning, setShowSllWarning] = useState(false);
	const [pendingRoleChange, setPendingRoleChange] = useState(null);

	const displayRole = profile?.role?.role_name || profile?.role_name || profile?.role || '';
	const isAdminRole = displayRole === 'Administrator';

	useEffect(() => {
		if (open && profile) {
			const initial = {
				username: profile.username || '',
				email: profile.email || '',
				isActive: profile.isActive ?? profile.is_active ?? true,
				emailConfirmed: profile.emailConfirmed ?? profile.email_confirmed ?? false,
				gdprAccepted: profile.gdprAccepted ?? profile.gdpr_accepted ?? false,
				role: displayRole,
				serviceLine: profile.serviceLineId ? String(profile.serviceLineId) : '',
				areas: (profile.areas || []).map((a) => ({
					area_id: a.areaId ?? a.area_id,
					is_primary: a.isPrimary ?? a.is_primary ?? false,
				})).filter((a) => a.area_id),
			};
			setForm(initial);
			initialRef.current = { ...initial, areas: [...initial.areas] };
			setErrors({});
			setIsDirty(false);
		}
	}, [open, profile, displayRole]);

	useEffect(() => {
		if (!open) return;
		getServiceLines().then(setServiceLines).catch(() => setServiceLines([]));
		getAreas().then(setAllAreas).catch(() => setAllAreas([]));
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [open, onClose]);

	const trimmedUsername = form.username?.trim() || '';
	const trimmedEmail = form.email?.trim() || '';

	const usernameChanged = trimmedUsername !== (initialRef.current.username?.trim() || '')
		&& trimmedUsername.length >= 3;
	const emailChanged = trimmedEmail !== (initialRef.current.email?.trim() || '')
		&& /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

	const usernameCheck = useAvailability({
		value: trimmedUsername,
		isValid: trimmedUsername.length >= 3,
		enabled: open && usernameChanged,
		fetcher: fetchUsernameAvailability,
	});

	const emailCheck = useAvailability({
		value: trimmedEmail,
		isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail),
		enabled: open && emailChanged,
		fetcher: fetchEmailAvailability,
	});

	const checkDirty = (next) => {
		const initial = initialRef.current;
		const changed = next.username !== initial.username
			|| next.email !== initial.email
			|| next.isActive !== initial.isActive
			|| next.emailConfirmed !== initial.emailConfirmed
			|| next.gdprAccepted !== initial.gdprAccepted
			|| next.role !== initial.role
			|| next.serviceLine !== initial.serviceLine
			|| JSON.stringify(next.areas) !== JSON.stringify(initial.areas);
		setIsDirty(changed);
	};

	const handleChange = (field) => (e) => {
		const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
		setForm((prev) => {
			const next = { ...prev, [field]: value };
			checkDirty(next);
			return next;
		});
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
	};

	const applyRoleChange = (newRole) => {
		setForm((prev) => {
			const next = { ...prev, role: newRole };
			if (newRole !== 'Service Line Leader') next.serviceLine = '';
			if (newRole !== 'Consultant') next.areas = [];
			if (newRole === 'Consultant' && initialRef.current.role === 'Consultant') {
				next.areas = [...initialRef.current.areas];
			}
			checkDirty(next);
			return next;
		});
	};

	const handleRoleChange = async (e) => {
		const newRole = e.target.value;
		const currentRole = initialRef.current.role;

		if (newRole === currentRole) return;

		if (currentRole === 'Service Line Leader' && newRole !== 'Service Line Leader' && profile.serviceLineId) {
			try {
				const { data } = await api.get(`/admin/service-lines/${profile.serviceLineId}/sll-count`);
				if (data?.data?.count <= 1) {
					setPendingRoleChange(newRole);
					setShowSllWarning(true);
					return;
				}
			} catch { /* proceed anyway */ }
		}

		applyRoleChange(newRole);
	};

	const validate = () => {
		const errs = {};
		if (!form.username?.trim()) errs.username = t('profile.errors.usernameRequired');
		else if (form.username.trim().length < 3) errs.username = t('profile.errors.usernameTooShort');
		if (!form.email?.trim()) errs.email = t('profile.errors.emailRequired');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('profile.errors.emailInvalid');

		if (form.role === 'Service Line Leader' && !form.serviceLine) {
			errs.serviceLine = t('adminUsers.serviceLineRequired');
		}
		if (form.role === 'Consultant' && (!form.areas || form.areas.length === 0)) {
			errs.areas = t('adminUsers.areasRequired');
		}

		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		if (usernameChanged && isCheckBlocking(usernameCheck.status)) {
			if (usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE) {
				setErrors((prev) => ({ ...prev, username: t('profile.errors.usernameTaken') }));
			}
			return;
		}
		if (emailChanged && isCheckBlocking(emailCheck.status)) {
			if (emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE) {
				setErrors((prev) => ({ ...prev, email: t('profile.errors.emailTaken') }));
			}
			return;
		}

		setSaving(true);
		try {
			const payload = {};
			if (usernameChanged) payload.username = form.username.trim();
			if (emailChanged) payload.email_address = form.email.trim();
			if (form.isActive !== initialRef.current.isActive) payload.approve_member = form.isActive;
			if (form.emailConfirmed !== initialRef.current.emailConfirmed) payload.email_confirmed = form.emailConfirmed;
			if (form.gdprAccepted !== initialRef.current.gdprAccepted) payload.gdpr_accepted = form.gdprAccepted;

			if (form.role !== initialRef.current.role) {
				payload.user_role = form.role;
			}
			if (form.role === 'Service Line Leader' && form.serviceLine) {
				payload.service_line_id = Number(form.serviceLine);
			}
			if (form.role === 'Consultant' && form.areas.length > 0) {
				payload.areas = form.areas;
			}

			if (Object.keys(payload).length > 0) {
				await updateUser(guid, payload);
			}
			setIsDirty(false);
			if (onSaved) await onSaved();
			onClose();
		} catch (err) {
			const serverErrors = err.response?.data?.errors;
			if (serverErrors) {
				const mapped = {};
				for (const [key, msg] of Object.entries(serverErrors)) mapped[key] = msg;
				setErrors((prev) => ({ ...prev, ...mapped }));
			}
		} finally {
			setSaving(false);
		}
	};

	const handleEditProfile = () => {
		onClose();
		navigate(`${ADMIN.USERS}/${guid}/edit`);
	};

	const joinedAt = profile?.createdAt || profile?.created_at;
	const lastLogin = profile?.lastLogin || profile?.last_login || profile?.last_online;

	const formatDate = (str) => {
		if (!str) return '—';
		return new Date(str).toLocaleDateString('pt-PT', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	};

	const serviceLineOptions = serviceLines.map((sl) => ({
		value: String(sl.service_line_id ?? sl.id),
		label: sl.service_line_name ?? sl.name ?? '',
	}));

	const areaOptions = allAreas.map((a) => ({
		area_id: a.area_id ?? a.id,
		area_name: a.area_name ?? a.name ?? '',
	}));

	return (
		<aside ref={panelRef} className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`} role="complementary" aria-label={t('profile.adminDetails')}>
			<div className={styles.drawerInner}>
			<div className={styles.drawerHeader}>
				<h3 className={styles.drawerTitle}>{t('profile.adminDetails')}</h3>
				<button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('shared.close')}>
					<Icon name="close" size={20} />
				</button>
			</div>

			<div className={styles.drawerBody}>
				<div>
					<FormInput
						id="admin-username"
						label={t('profile.username')}
						value={form.username || ''}
						onChange={handleChange('username')}
						error={errors.username || (usernameCheck.status === AVAILABILITY_STATUS.UNAVAILABLE ? t('profile.errors.usernameTaken') : null)}
						required
					/>
					{usernameChanged && usernameCheck.status === AVAILABILITY_STATUS.CHECKING && (
						<small className="text-muted">{t('register.checkingAvailability')}</small>
					)}
					{usernameChanged && usernameCheck.status === AVAILABILITY_STATUS.AVAILABLE && (
						<small className="text-success">{t('register.usernameAvailable')}</small>
					)}
				</div>

				<div>
					<FormInput
						id="admin-email"
						label={t('profile.email')}
						value={form.email || ''}
						onChange={handleChange('email')}
						error={errors.email || (emailCheck.status === AVAILABILITY_STATUS.UNAVAILABLE ? t('profile.errors.emailTaken') : null)}
						required
					/>
					{emailChanged && emailCheck.status === AVAILABILITY_STATUS.CHECKING && (
						<small className="text-muted">{t('register.checkingAvailability')}</small>
					)}
					{emailChanged && emailCheck.status === AVAILABILITY_STATUS.AVAILABLE && (
						<small className="text-success">{t('register.emailAvailable')}</small>
					)}
				</div>

				{isAdminRole ? (
					<DetailRow label={t('profile.role')}>{t(`roles.${displayRole}`)}</DetailRow>
				) : (
					<div>
						<label htmlFor="admin-role" className={styles.detailLabel}>{t('profile.role')}</label>
						<CustomSelect
							id="admin-role"
							name="role"
							value={form.role || ''}
							onChange={handleRoleChange}
							options={CHANGEABLE_ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
						/>
					</div>
				)}

				{form.role === 'Service Line Leader' && (
					<div>
						<label htmlFor="admin-sl" className={styles.detailLabel}>{t('shared.serviceLine')}</label>
						<CustomSelect
							id="admin-sl"
							name="serviceLine"
							value={form.serviceLine}
							onChange={handleChange('serviceLine')}
							options={serviceLineOptions}
							placeholder={t('adminUsers.selectServiceLine')}
							error={!!errors.serviceLine}
						/>
						{errors.serviceLine && (
							<small className="text-danger">{errors.serviceLine}</small>
						)}
					</div>
				)}

				{form.role === 'Consultant' && (
					<div>
						<label className={styles.detailLabel}>{t('register.areasOfExpertise')}</label>
						<AreaPickerList
							areas={areaOptions}
							selected={form.areas || []}
							onChange={(areas) => {
								setForm((prev) => {
									const next = { ...prev, areas };
									checkDirty(next);
									return next;
								});
								if (errors.areas) setErrors((prev) => ({ ...prev, areas: null }));
							}}
							error={errors.areas}
						/>
					</div>
				)}

				<DetailRow label={t('profile.joinedAt')}>{formatDate(joinedAt)}</DetailRow>
				<DetailRow label={t('profile.lastLogin')}>{formatDate(lastLogin)}</DetailRow>

				<div className={styles.toggleGroup}>
					<label className={styles.toggleRow}>
						<span>{t('profile.isActive')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.isActive || false}
							onChange={handleChange('isActive')}
						/>
					</label>

					<label className={styles.toggleRow}>
						<span>{t('profile.emailConfirmed')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.emailConfirmed || false}
							onChange={handleChange('emailConfirmed')}
						/>
					</label>

					<label className={styles.toggleRow}>
						<span>{t('profile.gdprAccepted')}</span>
						<input
							type="checkbox"
							className="form-check-input"
							checked={form.gdprAccepted || false}
							onChange={handleChange('gdprAccepted')}
						/>
					</label>
				</div>

				<button type="button" className={styles.editProfileLink} onClick={handleEditProfile}>
					<Icon name="pencil" size={16} color="var(--color-primary)" />
					<span>{t('profile.editProfileDetails')}</span>
				</button>
			</div>

			<div className={styles.drawerFooter}>
				<Button variant="outlined" onClick={onClose} disabled={saving}>
					{t('profile.cancel')}
				</Button>
				<Button
					onClick={handleSave}
					loading={saving}
					disabled={!isDirty || (usernameChanged && isCheckBlocking(usernameCheck.status)) || (emailChanged && isCheckBlocking(emailCheck.status))}
				>
					{t('profile.saveChanges')}
				</Button>
			</div>
			</div>

			<ConfirmToast
				open={showSllWarning}
				message={t('adminUsers.sllLastLeaderWarning')}
				confirmLabel={t('shared.yes')}
				cancelLabel={t('shared.no')}
				onConfirm={() => {
					setShowSllWarning(false);
					applyRoleChange(pendingRoleChange);
					setPendingRoleChange(null);
				}}
				onCancel={() => {
					setShowSllWarning(false);
					setPendingRoleChange(null);
				}}
			/>
		</aside>
	);
}
