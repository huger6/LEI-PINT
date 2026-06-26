import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SHARED } from '../../../routes/paths';
import AuthLayout from '../../../features/auth/layouts/AuthLayout/AuthLayout';
import AuthCard from '../../../features/auth/components/AuthCard/AuthCard';
import Button from '../../../components/Button/Button';
import styles from './ErrorCodePage.module.css';

// Renders an error page (default 404) with a localized title/description per code
export default function ErrorCodePage({ code = 404 }) {
	// Translation helper
	const { t } = useTranslation();
	const defaultTitle = t('errorCodePage.defaultTitle');
	const defaultDescription = t('errorCodePage.defaultDescription');
	const title = t(`errorCodePage.codes.${code}.title`, { defaultValue: defaultTitle });
	const description = t(`errorCodePage.codes.${code}.description`, { defaultValue: defaultDescription });

	return (
		<AuthLayout>
			<AuthCard>
				<div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
					<h1 className={styles.errorCode}>
						{code}
					</h1>
					<h2 className={styles.title}>
						{title}
					</h2>
					<p className={styles.description}>
						{description}
					</p>
					<Button as={Link} to={SHARED.HOME}>
						{t('errorCodePage.backHome')}
					</Button>
				</div>
			</AuthCard>
		</AuthLayout>
	);
}
