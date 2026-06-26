import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../../routes/paths';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth, changePassword } from '../..';
import FormInput from '../../../../components/FormInput/FormInput';
import Button from '../../../../components/Button/Button';
import PasswordRules from '../../../../components/PasswordRules/PasswordRules';
import PasswordToggle from '../../../../components/PasswordToggle/PasswordToggle';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import Icon from '../../../../components/Icons/Icons';
import { useFormWithServerErrors } from '../../../../hooks/useFormWithServerErrors';
import styles from './ChangePasswordPage.module.css';
import {
	validateChangePasswordForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
} from '../../../../validations';

export default function ChangePasswordPage() {
	// Provides translation function for localised strings.
	const { t } = useTranslation();
	// Accesses the function to mark force-password-change as complete.
	const { completeFpc } = useAuth();
	// Provides programmatic navigation after a successful password change.
	const navigate = useNavigate();

	// Initialises the form state with server-error support and change-password validation.
	const form = useFormWithServerErrors({
		initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
		validate: validateChangePasswordForm,
	});

	// Tracks visibility toggle state for the current password field.
	const [showCurrent, setShowCurrent] = useState(false);
	// Tracks visibility toggle state for the new password field.
	const [showNew, setShowNew] = useState(false);
	// Tracks whether the form submission is in progress.
	const [loading, setLoading] = useState(false);
	// Tracks whether the password change completed successfully.
	const [success, setSuccess] = useState(false);

	// Redirects to the home page two seconds after a successful password change.
	useEffect(() => {
		if (!success) return;
		const timer = setTimeout(() => navigate(SHARED.HOME, { replace: true }), 2000);
		return () => clearTimeout(timer);
	}, [success, navigate]);

	// Validates and submits the change-password form, handling server errors.
	const handleSubmit = async (e) => {
		e.preventDefault();
		form.markAllTouched();
		if (hasErrors(form.errors)) return;

		setLoading(true);
		form.clearServerErrors();
		try {
			const result = await changePassword(form.values.currentPassword, form.values.newPassword);
			completeFpc(result?.data?.data);
			setSuccess(true);
		} catch (err) {
			const backendFields = extractFieldErrors(err);
			if (Object.keys(backendFields).length) {
				form.setServerFieldErrors(backendFields);
				return;
			}
			const focusField = resolveErrorField(err);
			const message = resolveErrorMessage(err);
			if (focusField) form.setServerFieldErrors({ [focusField]: message });
			else form.setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout>
			<Helmet>
				<title>{t('changePassword.title')}</title>
				<meta name="description" content={t('changePassword.metaDescription')} />
			</Helmet>
			<AuthCard>
				{success ? (
					<div className="d-flex flex-column align-items-center gap-3 py-4 text-center">
						<div className={styles.successIcon}><Icon name="check" size={24} aria-hidden="true" /></div>
						<h2 className={`mb-0 ${styles.title}`}>{t('changePassword.successHeading')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>{t('changePassword.redirecting')}</p>
					</div>
				) : (
					<>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('changePassword.heading')}</h2>
						<p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
							{t('changePassword.subtitle')}
						</p>
						<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
							<FormInput
								{...form.getFieldProps('currentPassword')}
								onChange={form.onChange}
								id="currentPassword"
								label={t('changePassword.currentPassword')}
								type={showCurrent ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={form.fieldError('currentPassword')}
								autoFocus
								autoComplete="current-password"
								trailing={<PasswordToggle show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />}
							/>

							<FormInput
								{...form.getFieldProps('newPassword')}
								onChange={form.onChange}
								id="newPassword"
								label={t('changePassword.newPassword')}
								type={showNew ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={form.fieldError('newPassword')}
								autoComplete="new-password"
								trailing={<PasswordToggle show={showNew} onToggle={() => setShowNew((v) => !v)} />}
							/>

							<PasswordRules password={form.values.newPassword} />

							<FormInput
								{...form.getFieldProps('confirmPassword')}
								onChange={form.onChange}
								id="confirmPassword"
								label={t('changePassword.confirmNewPassword')}
								type={showNew ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={form.fieldError('confirmPassword')}
								autoComplete="new-password"
							/>

							<FormAlert message={form.error} />
							<Button type="submit" loading={loading} fullWidth>{t('changePassword.changeBtn')}</Button>
						</form>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}

