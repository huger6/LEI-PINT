import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '../../validations';
import Icon from '../Icons/Icons';
import styles from './PasswordRules.module.css';

/**
 * Live password strength checklist that shows pass/fail status for each rule.
 * @param {string} password - Current password value to validate against rules.
 */
// Renders a checklist of password rules with pass/fail indicators for each.
export default function PasswordRules({ password }) {
	// Provides translated rule label strings.
	const { t } = useTranslation();
	if (!password) return null;

	return (
		<ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
			{PASSWORD_RULES.map((rule) => {
				const passed = rule.test(password);
				return (
					<li key={rule.key} className={`${styles.pwRule} ${passed ? styles.pwRuleOk : ''}`}>
						<Icon name={passed ? 'check_circle' : 'circle'} size={14} aria-hidden="true" />{' '}
						{t(`passwordRules.${rule.key}`)}
					</li>
				);
			})}
		</ul>
	);
}
