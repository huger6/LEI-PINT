import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import { AuthCard, forgotPassword } from '../..';
import FormInput from '../../../../components/FormInput/FormInput';
import Button from '../../../../components/Button/Button';
import FormAlert from '../../../../components/FormAlert/FormAlert';
import Icon from '../../../../components/Icons/Icons';
import hideEmail from '../../../../utils/utils';
import styles from './ForgotPasswordPage.module.css';
import {
	validateForgotPasswordForm,
	hasErrors,
	resolveErrorMessage,
	resolveErrorField,
	extractFieldErrors,
} from '../../../../validations';

export default function ForgotPasswordPage() {
	const { t } = useTranslation();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		const validationErrors = validateForgotPasswordForm({ email });
		if (hasErrors(validationErrors)) {
			setError(validationErrors.email);
			return;
		}

		setLoading(true);
		setError('');
		try {
			await forgotPassword(email.trim());
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
				<title>{t('forgotPassword.title')}</title>
				<meta name="description" content={t('forgotPassword.metaDescription')} />
			</Helmet>
			<AuthCard>
				{sent ? (
					<div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
						<div className={styles.sentIcon}><Icon name="email" size={24} aria-hidden="true" /></div>
						<h2 className={`mb-0 ${styles.title}`}>{t('forgotPassword.checkInbox')}</h2>
						<p className="mb-0 small" style={{ color: 'var(--color-outline)', lineHeight: 1.55 }}>
							<Trans i18nKey="forgotPassword.checkInboxDesc" values={{ email: hideEmail(email) }} components={{ strong: <strong /> }} />
						</p>
						<Link to="/login" className="small" style={{ color: 'var(--color-primary)' }}>{t('backToLogin')}</Link>
					</div>
				) : (
					<>
						<h2 className={`text-center mb-1 ${styles.title}`}>{t('forgotPassword.heading')}</h2>
						<p className="text-center mb-4 small" style={{ color: 'var(--color-outline)' }}>
							{t('forgotPassword.subtitle')}
						</p>
						<form onSubmit={handleSubmit} className="vstack gap-3" noValidate>
							<FormInput
								name="email"
								value={email}
								onChange={(e) => { setEmail(e.target.value); setError(''); }}
								id="email"
								label={t('forgotPassword.emailAddress')}
								type="email"
								placeholder={t('emailPlaceholder')}
								autoFocus
							/>
							<FormAlert message={error} />
							<Button type="submit" loading={loading} fullWidth>{t('forgotPassword.sendResetLink')}</Button>
						</form>
						<Button as={Link} to="/login" variant="outlined" className="mt-1" fullWidth>
							<Icon name="keyboard_arrow_down" size={16} className="me-2" style={{ transform: 'rotate(90deg)' }} aria-hidden="true" />{t('backToLogin')}
						</Button>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}

