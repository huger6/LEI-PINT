import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH } from '../../../../routes/paths';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, confirmEmail, StatusPanel } from '../..';
import Button from '../../../../components/Button/Button';
import { resolveErrorMessage } from '../../../../validations';

export default function ConfirmEmailPage() {
	// Provides translation function for localised strings.
	const { t } = useTranslation();
	// Reads query parameters from the current URL to extract the confirmation token.
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	// Tracks the confirmation status: 'loading', 'success', or 'error'.
	const [status, setStatus] = useState('loading');
	// Stores the error message to display when confirmation fails.
	const [errorMsg, setErrorMsg] = useState('');
	// Guards against running the confirmation API call more than once.
	const requestRef = useRef(false);

	// Confirms the email address on mount using the token from the URL.
	useEffect(() => {
		if (requestRef.current) return;
		requestRef.current = true;
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
			<div>
				{status === 'loading' && (
					<StatusPanel
						variant="loading"
						message={t('confirmEmail.confirming')}
						loadingLabel={t('confirmEmail.confirming')}
					/>
				)}

				{status === 'success' && (
					<StatusPanel
						variant="success"
						title={t('confirmEmail.successHeading')}
						message={t('confirmEmail.successDesc')}
					>
						<Button as={Link} to={AUTH.LOGIN} fullWidth>
						{t('goToLogin')}
					</Button>
					</StatusPanel>
				)}

				{status === 'error' && (
					<StatusPanel
						variant="error"
						title={t('confirmEmail.failedHeading')}
						message={errorMsg}
					>
						<Button as={Link} to={AUTH.RESEND_CONFIRMATION} fullWidth>
							{t('confirmEmail.resendBtn')}
						</Button>
						<Button as={Link} to={AUTH.LOGIN} variant="outlined" fullWidth>
							{t('backToLogin')}
						</Button>
					</StatusPanel>
				)}
			</div>
		</AuthLayout>
	);
}

