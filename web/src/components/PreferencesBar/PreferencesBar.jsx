import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './PreferencesBar.module.css';

const LANGS = [
	{ code: 'pt', label: 'PT' },
	{ code: 'en', label: 'EN' },
	{ code: 'es', label: 'ES' },
];

export default function PreferencesBar({ floating = false, className = '' }) {
	const { i18n } = useTranslation();
	const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

	const toggleTheme = () => {
		const next = theme === 'dark' ? 'light' : 'dark';
		setTheme(next);
		localStorage.setItem('theme', next);
		document.documentElement.setAttribute('data-theme', next);
	};

	return (
		<div className={`${styles.bar} ${floating ? styles.floating : ''} ${className}`}>
			<div className={styles.langSwitch}>
				{LANGS.map((l) => (
					<button
						key={l.code}
						type="button"
						className={`${styles.langBtn} ${i18n.resolvedLanguage === l.code ? styles.langActive : ''}`}
						onClick={() => i18n.changeLanguage(l.code)}
					>
						{l.label}
					</button>
				))}
			</div>

			<button
				type="button"
				className={styles.themeBtn}
				onClick={toggleTheme}
				aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
			>
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
			</button>
		</div>
	);
}
