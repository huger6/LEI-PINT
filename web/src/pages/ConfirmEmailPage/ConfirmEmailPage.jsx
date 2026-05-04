import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, confirmEmail } from '../../features/auth';
import FormButton from '../../components/FormButton/FormButton';
import styles from './ConfirmEmailPage.module.css';
import { resolveErrorMessage } from '../../validations';

export default function ConfirmEmailPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const [status, setStatus] = useState('loading');
	const [errorMsg, setErrorMsg] = useState('');

	useEffect(() => {
		if (!token) {
			setErrorMsg(t('confirmEmail.noTokenFound'));
			setStatus('error');
			return;
		}
		confirmEmail(token)
			.then(() => setStatus('success'))
			.catch((err) => {
				setErrorMsg(resolveErrorMessage(err));
				setStatus('error');
			});
	}, [token, t]);

	return (
		<AuthLayout>
			<Helmet>
				<title>{t('confirmEmail.title')}</title>
				<meta name="description" content={t('confirmEmail.metaDescription')} />
			</Helmet>
			<AuthCard>
				{status === 'loading' && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.spinner} role="status" aria-label={t('confirmEmail.confirming')} />
						<p className="mb-0 small" style={{ color: 'var(--color-outline)' }}>{t('confirmEmail.confirming')}</p>
					</div>
				)}

				{status === 'success' && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.successIcon}>✓</div>
						<h2 className={`mb-0 ${styles.title}`}>{t('confirmEmail.successHeading')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>{t('confirmEmail.successDesc')}</p>
						<Link to="/login">
							<FormButton type="button">{t('goToLogin')}</FormButton>
						</Link>
					</div>
				)}

				{status === 'error' && (
					<div className="d-flex flex-column align-items-center gap-3 py-3 text-center">
						<div className={styles.errorIcon}>✕</div>
						<h2 className={`mb-0 ${styles.title}`}>{t('confirmEmail.failedHeading')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.5 }}>{errorMsg}</p>
						<Link to="/resend-confirmation">
							<FormButton type="button">{t('confirmEmail.resendBtn')}</FormButton>
						</Link>
						<Link to="/login" className="small" style={{ color: 'var(--color-primary)' }}>{t('backToLogin')}</Link>
					</div>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
