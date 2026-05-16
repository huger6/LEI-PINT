import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateUser } from '../../../features/users/api/usersApi';
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
import { ADMIN } from '../../../routes/paths';
import styles from './AdminUserDrawer.module.css';

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

	useEffect(() => {
		if (open && profile) {
			const initial = {
				username: profile.username || '',
				email: profile.email || '',
				isActive: profile.isActive ?? profile.is_active ?? true,
				emailConfirmed: profile.emailConfirmed ?? profile.email_confirmed ?? false,
				gdprAccepted: profile.gdprAccepted ?? profile.gdpr_accepted ?? false,
			};
			setForm(initial);
			initialRef.current = { ...initial };
			setErrors({});
			setIsDirty(false);
		}
	}, [open, profile]);

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
		enabled: usernameChanged,
		fetcher: fetchUsernameAvailability,
	});

	const emailCheck = useAvailability({
		value: trimmedEmail,
		isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail),
		enabled: emailChanged,
		fetcher: fetchEmailAvailability,
	});

	const checkDirty = (next) => {
		setIsDirty(JSON.stringify(next) !== JSON.stringify(initialRef.current));
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

	const validate = () => {
		const errs = {};
		if (!form.username?.trim()) errs.username = t('profile.errors.usernameRequired');
		else if (form.username.trim().length < 3) errs.username = t('profile.errors.usernameTooShort');
		if (!form.email?.trim()) errs.email = t('profile.errors.emailRequired');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('profile.errors.emailInvalid');
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

	const displayRole = profile?.role?.role_name || profile?.role_name || profile?.role || '—';
	const joinedAt = profile?.createdAt || profile?.created_at;
	const lastLogin = profile?.lastLogin || profile?.last_login || profile?.last_online;

	const formatDate = (str) => {
		if (!str) return '—';
		return new Date(str).toLocaleDateString('pt-PT', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit',
		});
	};

	if (!open) return null;

	return (
		<aside ref={panelRef} className={styles.drawer} role="dialog" aria-label={t('profile.adminDetails')}>
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

				<DetailRow label={t('profile.role')}>{t(`roles.${displayRole}`)}</DetailRow>
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
		</aside>
	);
}
