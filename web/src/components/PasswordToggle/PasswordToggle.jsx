import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './PasswordToggle.module.css';

/**
 * Eye icon button to toggle password field visibility.
 * @param {boolean} show - Current visibility state.
 * @param {Function} onToggle - Called when the toggle is clicked.
 */
// Renders an eye icon button that toggles a password field between visible and hidden.
export default function PasswordToggle({ show, onToggle }) {
	// Provides translated aria-label for the toggle button.
	const { t } = useTranslation();

	return (
		<button
			type="button"
			className={styles.eyeToggle}
			onClick={onToggle}
			tabIndex={-1}
			aria-label={t('togglePasswordVisibility')}
		>
			<Icon
				name={show ? 'eye-slash' : 'eye'}
				size={16}
				aria-hidden="true"
			/>
		</button>
	);
}
