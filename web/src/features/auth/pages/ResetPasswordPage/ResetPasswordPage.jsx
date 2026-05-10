import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, validateResetToken, resetPassword } from '../..';
import FormInput from '../../../../components/FormInput/FormInput';
import FormButton from '../../../../components/FormButton/FormButton';
import PasswordRules from '../../../../components/PasswordRules/PasswordRules';
import PasswordToggle from '../../../../components/PasswordToggle/PasswordToggle';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import Icon from '../../../../components/Icons/Icons';
import { useFormWithServerErrors } from '../../../../hooks/useFormWithServerErrors';
import styles from './ResetPasswordPage.module.css';
import {
	validateResetPasswordForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
	isCode,
} from '../../../../validations';

export default function ResetPasswordPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const form = useFormWithServerErrors({
		initialValues: { newPassword: '', confirmPassword: '' },
		validate: validateResetPasswordForm,
	});

	const [tokenStatus, setTokenStatus] = useState('loading');
	const [tokenErrorMsg, setTokenErrorMsg] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			setTokenErrorMsg(t('resetPassword.noTokenFound'));
			setTokenStatus('invalid');
			return;
		}
		validateResetToken(token)
			.then(() => setTokenStatus('valid'))
			.catch((err) => {
				if (isCode(err, 'AUTH_TOKEN_EXPIRED')) {
					setTokenErrorMsg(t('resetPassword.tokenExpired'));
				} else {
					setTokenErrorMsg(resolveErrorMessage(err));
				}
				setTokenStatus('invalid');
			});
	}, [token, t]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		form.markAllTouched();
		if (hasErrors(form.errors)) return;

		setLoading(true);
		form.clearServerErrors();
		try {
			await resetPassword(token, form.values.newPassword);
			setSuccess(true);
		} catch (err) {
			if (isCode(err, 'AUTH_TOKEN_EXPIRED') || isCode(err, 'AUTH_TOKEN_INVALID_OR_USED')) {
				setTokenErrorMsg(resolveErrorMessage(err));
				setTokenStatus('invalid');
				return;
			}
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
				<title>{t('resetPassword.title')}</title>
				<meta name="description" content={t('resetPassword.metaDescription')} />
			</Helmet>
			<AuthCard>
				{tokenStatus === 'loading' && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.spinner} aria-label={t('resetPassword.validatingLink')} />
						<p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>{t('resetPassword.validatingLink')}</p>
					</div>
				)}

				{tokenStatus === 'invalid' && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.errorIcon}><Icon name="close" size={24} color="currentColor" fill="currentColor" stroke="none" /></div>
						<h2 className={`mb-0 ${styles.title}`}>{t('resetPassword.invalidOrExpired')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>
							{tokenErrorMsg || t('resetPassword.invalidOrExpiredDesc')}
						</p>
						<Link to="/forgot-password">
							<FormButton type="button">{t('resetPassword.requestNewLink')}</FormButton>
						</Link>
					</div>
				)}

				{tokenStatus === 'valid' && !success && (
					<>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('resetPassword.heading')}</h2>
						<p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>{t('resetPassword.subtitle')}</p>
						<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
							<FormInput
								{...form.getFieldProps('newPassword')}
								onChange={form.onChange}
								id="newPassword"
								label={t('resetPassword.newPassword')}
								type={showPassword ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={form.fieldError('newPassword')}
								autoFocus
								trailing={<PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
							/>

							<PasswordRules password={form.values.newPassword} />

							<FormInput
								{...form.getFieldProps('confirmPassword')}
								onChange={form.onChange}
								id="confirmPassword"
								label={t('resetPassword.confirmPassword')}
								type={showPassword ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={form.fieldError('confirmPassword')}
							/>

							<FormAlert message={form.error} />
							<FormButton type="submit" loading={loading}>{t('resetPassword.resetBtn')}</FormButton>
						</form>
					</>
				)}

				{success && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.successIcon}><Icon name="check" size={24} color="currentColor" /></div>
						<h2 className={`mb-0 ${styles.title}`}>{t('resetPassword.successHeading')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>{t('resetPassword.successDesc')}</p>
						<Link to="/login">
							<FormButton type="button">{t('goToLogin')}</FormButton>
						</Link>
					</div>
				)}
			</AuthCard>
		</AuthLayout>
	);
}

