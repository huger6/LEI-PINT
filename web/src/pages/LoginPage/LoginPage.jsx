import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './LoginPage.module.css';
import Logo from '../../components/Logo/Logo';
import { resolveErrorMessage, isCode } from '../../validations';

const INITIAL = { identifier: '', password: '', remember: false };

export default function LoginPage() {
	const { t } = useTranslation();
	const { login } = useAuth();
	const navigate = useNavigate();

	const [form, setForm] = useState(INITIAL);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
	const [loading, setLoading] = useState(false);

	const loginEmail = form.identifier.trim().includes('@') ? form.identifier.trim() : '';

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
		setError('');
		setEmailNotConfirmed(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.identifier.trim() || !form.password) {
			setError(t('login.fillAllFields'));
			return;
		}

		setLoading(true);
		setError('');
		setEmailNotConfirmed(false);
		try {
			const fpc = await login(
				form.identifier.trim(),
				form.password,
				form.remember
			);
			navigate(fpc ? '/change-password' : '/', { replace: true });
		} catch (err) {
			if (isCode(err, 'AUTH_EMAIL_NOT_CONFIRMED')) {
				setEmailNotConfirmed(true);
				return;
			}
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout>
			<Helmet>
				<title>{t('login.title')}</title>
				<meta name="description" content={t('login.metaDescription')} />
			</Helmet>
			<AuthCard>
				{emailNotConfirmed ? (
					<div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
						<div className={styles.warningIcon}>⚠</div>
						<h2 className={`mb-0 ${styles.title}`}>{t('login.emailNotConfirmed')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
							{t('login.emailNotConfirmedDesc')}
						</p>
						<div className={styles.emailActions}>
							<Link
								to={loginEmail ? `/resend-confirmation?email=${encodeURIComponent(loginEmail)}` : '/resend-confirmation'}
								state={{ email: loginEmail }}
								className={styles.emailActionLink}
								style={{ color: 'var(--color-primary)' }}
							>
								<FormButton type="button">
									{t('login.resendConfirmation')}
								</FormButton>
							</Link>
							<Link to="/login" className={styles.emailActionLink}>
								<FormButton variant="ghost" type="button">
									<i className="bi bi-arrow-left me-2" />{t('backToLogin')}
								</FormButton>
							</Link>
						</div>
					</div>
				) : (
					<>
						<Logo />
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('login.welcome')}</h2>
						<p className={`text-center mb-4 small ${styles.subtitle}`}>{t('login.subtitle')}</p>

						<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
							<FormInput
								name="identifier"
								value={form.identifier}
								onChange={handleChange}
								id="identifier"
								label={t('login.emailOrUsername')}
								type="text"
								placeholder={t('emailPlaceholder')}
								autoComplete="username"
								autoFocus
							/>

							<div className="position-relative">
								<FormInput
									name="password"
									value={form.password}
									onChange={handleChange}
									id="password"
									label={t('login.password')}
									type={showPassword ? 'text' : 'password'}
									placeholder={t('passwordPlaceholder')}
									autoComplete="current-password"
								/>
								<button
									type="button"
									className={styles.eyeToggle}
									onClick={() => setShowPassword((v) => !v)}
									aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
									tabIndex={-1}
								>
									<i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
								</button>
							</div>

							<div className="d-flex align-items-center justify-content-between gap-2">
								<div className="d-flex align-items-center form-check mb-0 gap-2">
									<input
										name="remember"
										checked={form.remember}
										onChange={handleChange}
										type="checkbox"
										id="remember"
										className={`form-check-input ${styles.rememberCheckbox}`}
									/>
									<label htmlFor="remember" className={`form-check-label small ${styles.rememberMe}`}>
										{t('login.rememberMe')}
									</label>
								</div>
								<Link to="/forgot-password" className="small text-nowrap" style={{ color: 'var(--color-primary)' }}>
									{t('login.forgotPassword')}
								</Link>
							</div>

							{error && (
								<div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">
									{error}
								</div>
							)}

							<FormButton type="submit" loading={loading}>
								{t('login.signIn')}
							</FormButton>
						</form>

						<p className="text-center mt-4 small mb-0" style={{ color: 'var(--color-outline)' }}>
							{t('login.noAccount')}{' '}
							<Link to="/register">{t('login.createOne')}</Link>
						</p>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
