import { useTranslation } from 'react-i18next';
import { PASSWORD_RULES } from '../../validations';
import styles from './PasswordRules.module.css';

export default function PasswordRules({ password }) {
	const { t } = useTranslation();
	if (!password) return null;

	return (
		<ul className={`list-unstyled vstack gap-1 py-2 px-3 mb-0 rounded ${styles.pwRules}`}>
			{PASSWORD_RULES.map((rule) => {
				const passed = rule.test(password);
				return (
					<li key={rule.key} className={`${styles.pwRule} ${passed ? styles.pwRuleOk : ''}`}>
						<i className={`bi ${passed ? 'bi-check2' : 'bi-circle'}`} aria-hidden="true" />{' '}
						{t(`passwordRules.${rule.key}`)}
					</li>
				);
			})}
		</ul>
	);
}
