import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth, changePassword } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ChangePasswordPage.module.css';
import {
	PASSWORD_RULES,
	useFormValidation,
	validateChangePasswordForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
} from '../../validations';

const INITIAL = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordPage() {
	const { t } = useTranslation();
	const { logout } = useAuth();
	const navigate = useNavigate();

	const form = useFormValidation({
		initialValues: INITIAL,
		validate: validateChangePasswordForm,
	});

	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

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
			await changePassword(form.values.currentPassword, form.values.newPassword);
			setSuccess(true);
			setTimeout(async () => {
				await logout();
				navigate('/login', { replace: true });
			}, 2000);
		} catch (err) {
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
				<title>{t('changePassword.title')}</title>
				<meta name="description" content={t('changePassword.metaDescription')} />
			</Helmet>
			<AuthCard>
				{success ? (
					<div className="d-flex flex-column align-items-center gap-3 py-4 text-center">
						<div className={styles.successIcon}>✓</div>
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
							<div className="position-relative">
								<FormInput
									{...form.getFieldProps('currentPassword')}
									onChange={onChange}
									id="currentPassword"
									label={t('changePassword.currentPassword')}
									type={showCurrent ? 'text' : 'password'}
									placeholder={t('passwordPlaceholder')}
									error={fieldError('currentPassword')}
									autoFocus
									autoComplete="current-password"
								/>
								<button
									type="button"
									className={styles.eyeToggle}
									onClick={() => setShowCurrent((v) => !v)}
									tabIndex={-1}
									aria-label={t('togglePasswordVisibility')}
								>
									<i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`} />
								</button>
							</div>

							<div className="position-relative">
								<FormInput
									{...form.getFieldProps('newPassword')}
									onChange={onChange}
									id="newPassword"
									label={t('changePassword.newPassword')}
									type={showNew ? 'text' : 'password'}
									placeholder={t('passwordPlaceholder')}
									error={fieldError('newPassword')}
									autoComplete="new-password"
								/>
								<button
									type="button"
									className={styles.eyeToggle}
									onClick={() => setShowNew((v) => !v)}
									tabIndex={-1}
									aria-label={t('togglePasswordVisibility')}
								>
									<i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
								</button>
							</div>

							{form.values.newPassword && (
								<ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
									{PASSWORD_RULES.map((rule) => (
										<li
											key={rule.key}
											className={`${styles.pwRule} ${rule.test(form.values.newPassword) ? styles.pwRuleOk : ''}`}
										>
											{rule.test(form.values.newPassword) ? t('changePassword.pwRulePass') : t('changePassword.pwRuleFail')} {t(`passwordRules.${rule.key}`)}
										</li>
									))}
								</ul>
							)}

							<FormInput
								{...form.getFieldProps('confirmPassword')}
								onChange={onChange}
								id="confirmPassword"
								label={t('changePassword.confirmNewPassword')}
								type={showNew ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								error={fieldError('confirmPassword')}
								autoComplete="new-password"
							/>

							{error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}

							<FormButton type="submit" loading={loading}>{t('changePassword.changeBtn')}</FormButton>
						</form>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
