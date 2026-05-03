import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, useAuth } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './LoginPage.module.css';
import Logo from '../../components/Logo/Logo';

const ERROR_MESSAGES = {
	AUTH_INVALID_CREDENTIALS: 'Invalid email/username or password.',
	AUTH_ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
	AUTH_ACCOUNT_LOCKED: 'Too many failed attempts. Please try again later.',
	AUTH_RATE_LIMIT_LOGIN: 'Too many login attempts. Please wait before trying again.',
};

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const [form, setForm] = useState({ identifier: '', password: '', remember: false });
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
		setError('');
		setEmailNotConfirmed(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.identifier || !form.password) {
			setError('Please fill in all fields.');
			return;
		}
		setLoading(true);
		setError('');
		setEmailNotConfirmed(false);
		try {
			const fpc = await login(form.identifier, form.password, form.remember);
			navigate(fpc ? '/change-password' : '/', { replace: true });
		} catch (err) {
			const code = err?.response?.data?.code;
			if (code === 'AUTH_EMAIL_NOT_CONFIRMED') {
				setEmailNotConfirmed(true);
			} else {
				setError(ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout>
			<Helmet>
				<title>Sign In — Softinsa</title>
				<meta name="description" content="Sign in to your Softinsa account." />
			</Helmet>
			<AuthCard>
				<Logo />
				<h2 className={`text-center mb-1 ${styles.title}`}>Welcome back</h2>
				<p className={`text-center mb-4 small ${styles.subtitle}`}>Sign in to your account</p>

				<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
					<FormInput
						id="identifier"
						name="identifier"
						label="Email or Username"
						type="text"
						placeholder="you@example.com"
						value={form.identifier}
						onChange={handleChange}
						autoComplete="username"
						autoFocus
					/>

					<div className="position-relative">
						<FormInput
							id="password"
							name="password"
							label="Password"
							type={showPassword ? 'text' : 'password'}
							placeholder="••••••••"
							value={form.password}
							onChange={handleChange}
							autoComplete="current-password"
						/>
						<button
							type="button"
							className={styles.eyeToggle}
							onClick={() => setShowPassword((v) => !v)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							tabIndex={-1}
						>
							<i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
						</button>
					</div>

					<div className="d-flex align-items-center justify-content-between gap-2">
						<div className="d-flex align-items-center form-check mb-0 gap-2">
							<input
								type="checkbox"
								id="remember"
								name="remember"
								checked={form.remember}
								onChange={handleChange}
								className={`form-check-input ${styles.rememberCheckbox}`}
							/>
							<label htmlFor="remember" className={`form-check-label small ${styles.rememberMe}`}>
								Remember me
							</label>
						</div>
						<Link to="/forgot-password" className="small text-nowrap" style={{ color: 'var(--color-primary)' }}>
							Forgot password?
						</Link>
					</div>

					{error && (
						<div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">
							{error}
						</div>
					)}

					{emailNotConfirmed && (
						<div className="alert alert-warning py-2 px-3 mb-0 small" role="alert">
							Your email is not confirmed.{' '}
							<Link to="/resend-confirmation">Resend confirmation email</Link>
						</div>
					)}

					<FormButton type="submit" loading={loading}>
						Sign in
					</FormButton>
				</form>

				<p className="text-center mt-4 small mb-0" style={{ color: 'var(--color-outline)' }}>
					Don&apos;t have an account?{' '}
					<Link to="/register">Create one</Link>
				</p>
			</AuthCard>
		</AuthLayout>
	);
}
