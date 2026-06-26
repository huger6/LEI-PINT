import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import NotificationPreferences from '../../../components/NotificationPreferences/NotificationPreferences';
import TitleSelector from '../../../components/TitleSelector/TitleSelector';
import ConsentSettings from '../../../components/ConsentSettings/ConsentSettings';
import Icon from '../../../components/Icons/Icons';
import { SHARED } from '../../../routes/paths';
import { useUser } from '../../../hooks/userContext';
import { useLanguageContext } from '../../../context/LanguageContext';
import styles from './Settings.module.css';

// iso code (pt-PT/en-GB/es-ES) -> short code used by i18n + the button labels.
const LANGUAGES = [
	{ code: 'pt', iso: 'pt-PT', label: 'Português' },
	{ code: 'en', iso: 'en-GB', label: 'English' },
	{ code: 'es', iso: 'es-ES', label: 'Español' },
];

// Settings page: appearance (theme), language, notifications and account links.
export default function Settings() {
	// Translation helper plus the i18n instance for language switching.
	const { t, i18n } = useTranslation();
	// Context handler that persists the user's language choice, plus the user
	// (its role gates the consultant-only public title selector).
	const { handleLanguageChange, user } = useUser();
	// Available languages loaded from the backend.
	const { languages } = useLanguageContext();
	// Current short language code (e.g. 'pt') derived from i18n.
	const currentLang = (i18n.language || 'pt').split('-')[0];

	// Active UI theme, initialized from localStorage (defaults to light).
	const [theme, setTheme] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'light');
	// Apply and persist a theme choice on the document root.
	const applyTheme = (next) => {
		setTheme(next);
		localStorage.setItem('theme', next);
		document.documentElement.setAttribute('data-theme', next);
	};

	// Persist the choice the same way the footer does: resolve the DB language_id
	// for the iso and call the context handler (updates i18n + the user record).
	const changeLanguage = (lang) => {
		const match = (languages || []).find((l) => l.language_iso === lang.iso || l.language_iso?.startsWith(lang.code));
		if (match) handleLanguageChange(match.language_id, match.language_iso);
		else i18n.changeLanguage(lang.code);
	};

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>{t('settings.title')}</h1>

			<ContentCard className={styles.section}>
				<CardHeader icon="moon" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('settings.appearance')} />
				<p className={styles.hint}>{t('settings.appearanceHint')}</p>
				<div className={styles.segmented}>
					<button
						type="button"
						className={`${styles.segmentedBtn} ${theme !== 'dark' ? styles.segmentedBtnActive : ''}`}
						onClick={() => applyTheme('light')}
						aria-pressed={theme !== 'dark'}
					>
						<Icon name="sun" size={16} /> {t('settings.modeLight')}
					</button>
					<button
						type="button"
						className={`${styles.segmentedBtn} ${theme === 'dark' ? styles.segmentedBtnActive : ''}`}
						onClick={() => applyTheme('dark')}
						aria-pressed={theme === 'dark'}
					>
						<Icon name="moon" size={16} /> {t('settings.modeDark')}
					</button>
				</div>
			</ContentCard>

			<ContentCard className={styles.section}>
				<CardHeader icon="language" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('settings.language')} />
				<p className={styles.hint}>{t('settings.languageHint')}</p>
				<div className={styles.segmented}>
					{LANGUAGES.map((l) => (
						<button
							key={l.code}
							type="button"
							className={`${styles.segmentedBtn} ${currentLang === l.code ? styles.segmentedBtnActive : ''}`}
							onClick={() => changeLanguage(l)}
							aria-pressed={currentLang === l.code}
						>
							{l.label}
						</button>
					))}
				</div>
			</ContentCard>

			<NotificationPreferences />

			{user?.role === 'Consultant' && <TitleSelector />}

			<ConsentSettings />

			<ContentCard className={styles.section}>
				<CardHeader icon="settings" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('settings.account')} />
				<div className={styles.linkList}>
					<Link to={SHARED.PRIVACY} className={styles.linkRow}>
						<Icon name="privacy" size={20} color="var(--color-secondary)" aria-hidden="true" />
						<span className={styles.linkLabel}>{t('userDropdown.privacy')}</span>
						<Icon name="chevron_forward" size={18} color="var(--color-outline)" aria-hidden="true" />
					</Link>
					<Link to={SHARED.SECURITY} className={styles.linkRow}>
						<Icon name="security" size={20} color="var(--color-secondary)" aria-hidden="true" />
						<span className={styles.linkLabel}>{t('security.title')}</span>
						<Icon name="chevron_forward" size={18} color="var(--color-outline)" aria-hidden="true" />
					</Link>
				</div>
			</ContentCard>
		</div>
	);
}
