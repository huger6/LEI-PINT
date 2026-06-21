import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Icon from '../../../components/Icons/Icons';
import { SHARED } from '../../../routes/paths';
import styles from './Settings.module.css';

const LANGUAGES = [
	{ code: 'pt', label: 'Português' },
	{ code: 'en', label: 'English' },
	{ code: 'es', label: 'Español' },
];

export default function Settings() {
	const { t, i18n } = useTranslation();
	const currentLang = (i18n.language || 'pt').split('-')[0];

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>{t('settings.title')}</h1>

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
