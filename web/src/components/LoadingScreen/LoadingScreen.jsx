import { useTranslation } from 'react-i18next';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
	const { t } = useTranslation();
	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<div className={`spinner-border ${styles.spinner}`} role="status" aria-label={t('loading')} />
		</div>
	);
}
