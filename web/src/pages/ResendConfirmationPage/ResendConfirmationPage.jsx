import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, resendConfirmation } from '../../features/auth';
import FormInput from '../../components/FormInput/FormInput';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ResendConfirmationPage.module.css';
import {
	validateResendConfirmationForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
} from '../../validations';

export default function ResendConfirmationPage() {
	const { t } = useTranslation();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const queryEmail = searchParams.get('email')?.trim() ?? '';
	const { email: stateEmail = '', message: redirectMessage = '' } = location.state ?? {};
	const initialEmail = queryEmail || String(stateEmail).trim();

	const [email, setEmail] = useState(initialEmail);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		const validationErrors = validateResendConfirmationForm({ email });
		if (hasErrors(validationErrors)) {
			setError(validationErrors.email);
			return;
		}

		setLoading(true);
		setError('');
		try {
			await resendConfirmation(email.trim());
			setSent(true);
		} catch (err) {
			const backendFields = extractFieldErrors(err);
			if (backendFields.email) {
				setError(backendFields.email);
				return;
			}
			const focusField = resolveErrorField(err);
			const message = resolveErrorMessage(err);
			setError(focusField === 'email' ? message : message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout>
			<Helmet>
				<title>Resend Confirmation — Softinsa</title>
				<meta name="description" content="Request a new confirmation email for your Softinsa Badges Platform account." />
			</Helmet>
			<AuthCard>
				{sent ? (
					<div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
						<div className={styles.sentIcon}>✉</div>
						<h2 className={`mb-0 ${styles.title}`}>Email sent!</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
							A new confirmation link has been sent to <strong>{email}</strong>. Check your
							inbox and spam folder.
						</p>
						<Link to="/login" className={styles.emailActionLink}>
							<FormButton variant="ghost" type="button">
								<i className="bi bi-arrow-left me-2" />{t('backToLogin')}
							</FormButton>
						</Link>
					</div>
				) : (
					<>
						<h2 className={`text-center mb-1 ${styles.title}`}>Resend confirmation</h2>
						<p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
							Enter your email and we&apos;ll send a new confirmation link.
						</p>
						{redirectMessage && (
							<div className="alert alert-warning py-2 px-3 mb-3 small" role="alert">
								{redirectMessage}
							</div>
						)}
						<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
							<FormInput
								name="email"
								value={email}
								onChange={(e) => { setEmail(e.target.value); setError(''); }}
								id="email"
								label="Email address"
								type="email"
								placeholder="you@example.com"
								autoFocus
							/>
							{error && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{error}</div>}
							<FormButton type="submit" loading={loading}>Resend email</FormButton>
						</form>
						<p className="text-center mt-1 mb-0 small">
							<Link to="/login" className={styles.emailActionLink}>
								<FormButton variant="ghost" type="button">
									<i className="bi bi-arrow-left me-2" />{t('backToLogin')}
								</FormButton>
							</Link>
						</p>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
