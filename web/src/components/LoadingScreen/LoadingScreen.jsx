import { useTranslation } from 'react-i18next';
import styles from './LoadingScreen.module.css';

/** Full-screen centered loading spinner shown during initial auth checks. */
// Renders a full-screen spinner while authentication state is being resolved.
export default function LoadingScreen() {
	// Provides translated aria-label for the spinner element.
	const { t } = useTranslation();
	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<div className={`spinner-border ${styles.spinner}`} role="status" aria-label={t('loading')} />
		</div>
	);
}
