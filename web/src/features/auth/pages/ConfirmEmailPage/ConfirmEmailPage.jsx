import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../../../layouts/AuthLayout/AuthLayout';
import { AuthCard, confirmEmail, StatusPanel } from '../..';
import FormButton from '../../../../components/FormButton/FormButton';
import { resolveErrorMessage } from '../../../../validations';

export default function ConfirmEmailPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const [status, setStatus] = useState('loading');
	const [errorMsg, setErrorMsg] = useState('');
	const requestRef = useRef(false);

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
			<AuthCard>
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
						<Link to="/login">
							<FormButton type="button">{t('goToLogin')}</FormButton>
						</Link>
					</StatusPanel>
				)}

				{status === 'error' && (
					<StatusPanel
						variant="error"
						title={t('confirmEmail.failedHeading')}
						message={errorMsg}
					>
						<Link to="/resend-confirmation">
							<FormButton type="button">{t('confirmEmail.resendBtn')}</FormButton>
						</Link>
						<Link to="/login">
							<FormButton variant="ghost" type="button">{t('backToLogin')}</FormButton>
						</Link>
					</StatusPanel>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
