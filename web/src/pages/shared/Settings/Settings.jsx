import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Icon from '../../../components/Icons/Icons';
import { getColorMode, setColorMode } from '../../../utils/colorMode';
import styles from './Settings.module.css';

const LANGUAGES = [
	{ code: 'pt', label: 'Português' },
	{ code: 'en', label: 'English' },
	{ code: 'es', label: 'Español' },
];

const MODES = [
	{ value: 'light', icon: 'sun', labelKey: 'settings.modeLight' },
	{ value: 'dark', icon: 'moon', labelKey: 'settings.modeDark' },
];

export default function Settings() {
	const { t, i18n } = useTranslation();
	const [mode, setMode] = useState(getColorMode());
	const currentLang = (i18n.language || 'pt').split('-')[0];

	function chooseMode(value) {
		setColorMode(value);
		setMode(value);
	}

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>{t('settings.title')}</h1>

			<ContentCard className={styles.section}>
				<CardHeader icon="moon" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('settings.appearance')} />
				<p className={styles.hint}>{t('settings.appearanceHint')}</p>
				<div className={styles.segmented}>
					{MODES.map((m) => (
						<button
							key={m.value}
							type="button"
							className={`${styles.segmentedBtn} ${mode === m.value ? styles.segmentedBtnActive : ''}`}
							onClick={() => chooseMode(m.value)}
							aria-pressed={mode === m.value}
						>
							<Icon name={m.icon} size={16} aria-hidden="true" />
							{t(m.labelKey)}
						</button>
					))}
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
							onClick={() => i18n.changeLanguage(l.code)}
							aria-pressed={currentLang === l.code}
						>
							{l.label}
						</button>
					))}
				</div>
			</ContentCard>
		</div>
	);
}
