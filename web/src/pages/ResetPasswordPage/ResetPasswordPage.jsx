import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, validateResetToken, resetPassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResetPasswordPage.module.css';
import {
	PASSWORD_RULES,
	useFormValidation,
	validateResetPasswordForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
	isCode,
} from '../../validations';

const INITIAL = { newPassword: '', confirmPassword: '' };

export default function ResetPasswordPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const form = useFormValidation({
		initialValues: INITIAL,
		validate: validateResetPasswordForm,
	});

	const [tokenStatus, setTokenStatus] = useState('loading');
	const [tokenErrorMsg, setTokenErrorMsg] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	const [error, setError] = useState('');
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

	const fieldError = (name) =>
		form.getFieldProps(name).error ?? serverFieldErrors[name];

	const onChange = (e) => {
		form.handleChange(e);
		setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
		setError('');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		form.markAllTouched();
		if (hasErrors(form.errors)) return;

		setLoading(true);
		setError('');
		setServerFieldErrors({});
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
				setServerFieldErrors(backendFields);
				return;
			}
			const focusField = resolveErrorField(err);
			const message = resolveErrorMessage(err);
			if (focusField) setServerFieldErrors({ [focusField]: message });
			else setError(message);
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
						<div className={styles.errorIcon}>✕</div>
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
							<div className="position-relative">
								<FormInput
									{...form.getFieldProps('newPassword')}
									onChange={onChange}
									id="newPassword"
									label={t('resetPassword.newPassword')}
									type={showPassword ? 'text' : 'password'}
									placeholder={t('passwordPlaceholder')}
									error={fieldError('newPassword')}
									autoFocus
								/>
								<button
									type="button"
									className={styles.eyeToggle}
									onClick={() => setShowPassword((v) => !v)}
									tabIndex={-1}
									aria-label={t('togglePasswordVisibility')}
								>
									<i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
								</button>
							</div>

							{form.values.newPassword && (
								<ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
									{PASSWORD_RULES.map((rule) => (
										<li
											key={rule.key}
											className={`${styles.pwRule} ${rule.test(form.values.newPassword) ? styles.pwRuleOk : ''}`}
										>
											{rule.test(form.values.newPassword) ? t('resetPassword.pwRulePass') : t('resetPassword.pwRuleFail')} {t(`passwordRules.${rule.key}`)}
										</li>
									))}
								</ul>
							)}

							<FormInput
								{...form.getFieldProps('confirmPassword')}
								onChange={onChange}
								id="confirmPassword"
								label={t('resetPassword.confirmPassword')}
								type={showPassword ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={fieldError('confirmPassword')}
							/>

							{error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}

							<FormButton type="submit" loading={loading}>{t('resetPassword.resetBtn')}</FormButton>
						</form>
					</>
				)}

				{success && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.successIcon}>✓</div>
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
