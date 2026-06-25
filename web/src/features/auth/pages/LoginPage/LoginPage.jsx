import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH, SHARED } from '../../../../routes/paths';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth } from '../..';
import FormInput from '../../../../components/FormInput/FormInput';
import Button from '../../../../components/Button/Button';
import PasswordToggle from '../../../../components/PasswordToggle/PasswordToggle';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import Logo from '../../../../components/Logo/Logo';
import Icon from '../../../../components/Icons/Icons';
import styles from './LoginPage.module.css';
import { resolveErrorMessage, isCode } from '../../../../validations';

export default function LoginPage() {
	// Provides translation function for localised strings.
	const { t } = useTranslation();
	// Accesses the login action and authentication status from auth context.
	const { login, isAuthenticated } = useAuth();
	// Provides programmatic navigation after a successful login.
	const navigate = useNavigate();
	// Reads the current location to retrieve the redirect path after login.
	const location = useLocation();

	// Stores the login form field values including identifier, password, and remember flag.
	const [form, setForm] = useState({ identifier: '', password: '', remember: false });
	// Tracks visibility toggle state for the password field.
	const [showPassword, setShowPassword] = useState(false);
	// Stores a general error message from failed login attempts.
	const [error, setError] = useState('');
	// Stores per-field validation error messages for identifier and password.
	const [fieldErrors, setFieldErrors] = useState({ identifier: '', password: '' });
	// Tracks whether the login failed specifically because the email is unconfirmed.
	const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
	// Tracks whether the login request is in progress.
	const [loading, setLoading] = useState(false);

	const from = location.state?.from?.pathname || '/';

	// Redirects already-authenticated users to their intended destination.
	useEffect(() => {
		if (isAuthenticated) {
			navigate(from, { replace: true });
		}
	}, [isAuthenticated, navigate, from]);

	const loginEmail = form.identifier.trim().includes('@') ? form.identifier.trim() : '';

	// Updates the form state and clears related errors on each field change.
	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
		setError('');
		setEmailNotConfirmed(false);
		if (name === 'identifier' || name === 'password') {
			setFieldErrors((prev) => ({ ...prev, [name]: '' }));
		}
	};

	// Validates the form and submits the login request, handling auth errors.
	const handleSubmit = async (e) => {
		e.preventDefault();
		const nextFieldErrors = {
			identifier: form.identifier.trim() ? '' : t('validation.identifierRequired'),
			password: form.password ? '' : t('validation.passwordRequired'),
		};
		if (nextFieldErrors.identifier || nextFieldErrors.password) {
			setFieldErrors(nextFieldErrors);
			return;
		}
		setFieldErrors({ identifier: '', password: '' });

		setLoading(true);
		setError('');
		setEmailNotConfirmed(false);
		try {
			const fpc = await login(
				form.identifier.trim(),
				form.password,
				form.remember
			);
			navigate(fpc ? AUTH.CHANGE_PASSWORD : SHARED.HOME, { replace: true });
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
						<div className={styles.warningIcon}><Icon name="danger" size={24} aria-hidden="true" /></div>
						<h2 className={`mb-0 ${styles.title}`}>{t('login.emailNotConfirmed')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
							{t('login.emailNotConfirmedDesc')}
						</p>
						<div className={styles.emailActions}>
							<Button
								as={Link}
								to={loginEmail ? `${AUTH.RESEND_CONFIRMATION}?email=${encodeURIComponent(loginEmail)}` : AUTH.RESEND_CONFIRMATION}
								state={{ email: loginEmail }}
								className={styles.emailActionLink}
								fullWidth
							>
								{t('login.resendConfirmation')}
							</Button>
							<Button
								type="button"
								variant="outlined"
								className={styles.emailActionLink}
								fullWidth
								onClick={() => { setEmailNotConfirmed(false); setError(''); }}
							>
								<Icon name="keyboard_arrow_down" size={16} className="me-2" style={{ transform: 'rotate(90deg)' }} aria-hidden="true" />{t('backToLogin')}
							</Button>
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
								error={fieldErrors.identifier}
							/>

							<FormInput
								name="password"
								value={form.password}
								onChange={handleChange}
								id="password"
								label={t('login.password')}
								type={showPassword ? 'text' : 'password'}
								placeholder={t('passwordPlaceholder')}
								autoComplete="current-password"
								trailing={<PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
								error={fieldErrors.password}
							/>

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
								<Link to={AUTH.FORGOT_PASSWORD} className="small text-nowrap" style={{ color: 'var(--color-primary)' }}>
									{t('login.forgotPassword')}
								</Link>
							</div>

							<FormAlert message={error} />

							<Button type="submit" loading={loading} fullWidth>
								{t('login.signIn')}
							</Button>
						</form>

						<p className="text-center mt-4 small mb-0" style={{ color: 'var(--color-outline)' }}>
							{t('login.noAccount')}{' '}
							<Link to={AUTH.REGISTER}>{t('login.createOne')}</Link>
						</p>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}

