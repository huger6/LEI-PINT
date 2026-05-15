import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { updateUser } from '../../../features/users/api/usersApi';
import Icon from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import FormInput from '../../../components/FormInput/FormInput';
import styles from './AdminUserDrawer.module.css';

function DetailRow({ label, children }) {
	return (
		<div className={styles.detailRow}>
			<span className={styles.detailLabel}>{label}</span>
			<span className={styles.detailValue}>{children}</span>
		</div>
	);
}

export default function AdminUserDrawer({ open, onClose, profile, guid }) {
	const { t } = useTranslation();
	const panelRef = useRef(null);

	const [form, setForm] = useState({});
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const initialRef = useRef({});

	useEffect(() => {
		if (open && profile) {
			const initial = {
				email: profile.email || '',
				role: profile.role?.role_name || profile.role_name || profile.role || '',
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
		if (!form.email?.trim()) errs.email = t('profile.errors.emailRequired');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('profile.errors.emailInvalid');
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			await updateUser(guid, form);
			setIsDirty(false);
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
		<>
			<div className={styles.backdrop} onClick={onClose} />
			<aside ref={panelRef} className={styles.drawer} role="dialog" aria-label={t('profile.adminDetails')}>
				<div className={styles.drawerHeader}>
					<h3 className={styles.drawerTitle}>{t('profile.adminDetails')}</h3>
					<button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('shared.close')}>
						<Icon name="close" size={20} />
					</button>
				</div>

				<div className={styles.drawerBody}>
					<FormInput
						id="admin-email"
						label={t('profile.email')}
						value={form.email || ''}
						onChange={handleChange('email')}
						error={errors.email}
						required
					/>

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
				</div>

				<div className={styles.drawerFooter}>
					<Button variant="outlined" onClick={onClose} disabled={saving}>
						{t('profile.cancel')}
					</Button>
					<Button onClick={handleSave} loading={saving} disabled={!isDirty}>
						{t('profile.saveChanges')}
					</Button>
				</div>
			</aside>
		</>
	);
}
