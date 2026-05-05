import { useTranslation } from 'react-i18next';
import styles from './PasswordToggle.module.css';

export default function PasswordToggle({ show, onToggle }) {
	const { t } = useTranslation();

	return (
		<button
			type="button"
			className={styles.eyeToggle}
			onClick={onToggle}
			tabIndex={-1}
			aria-label={t('togglePasswordVisibility')}
		>
			<i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
		</button>
	);
}
