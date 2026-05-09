import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth, changePassword } from '../..';
import FormInput from '../../../../components/FormInput/FormInput';
import FormButton from '../../../../components/FormButton/FormButton';
import PasswordRules from '../../../../components/PasswordRules/PasswordRules';
import PasswordToggle from '../../../../components/PasswordToggle/PasswordToggle';
import FormAlert from '../../../../components/FormAlert/FormAlert';
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
	const { t } = useTranslation();
	const { completeFpc } = useAuth();
	const navigate = useNavigate();

	const form = useFormWithServerErrors({
		initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
		validate: validateChangePasswordForm,
	});

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!success) return;
		const timer = setTimeout(() => navigate('/', { replace: true }), 2000);
		return () => clearTimeout(timer);
	}, [success, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		form.markAllTouched();
		if (hasErrors(form.errors)) return;

		setLoading(true);
		form.clearServerErrors();
		try {
			const result = await changePassword(form.values.currentPassword, form.values.newPassword);
			const newToken = result?.data?.data?.token;
			completeFpc(newToken);
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
						<div className={styles.successIcon}><i className="bi bi-check-lg" aria-hidden="true" /></div>
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
							<FormButton type="submit" loading={loading}>{t('changePassword.changeBtn')}</FormButton>
						</form>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
