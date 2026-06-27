import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PreferencesBar from '../../../components/PreferencesBar/PreferencesBar';
import styles from './SoftinsaSite.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

// Shared navbar for the whole public Softinsa microsite (landing page, public
// consultant profile and public badge page) so the header is always identical.
// Section links are absolute (/softinsa#...) so they also work from the sub-pages,
// navigating back to the landing sections.
export default function SoftinsaNav() {
	const { t } = useTranslation();
	return (
		<header className={styles.nav}>
			<div className={styles.navInner}>
				<a href="/softinsa#top" className={styles.brand}>
					<img src={LOGO_SRC} alt="Softinsa" className={styles.logoImg} />
				</a>
				<nav className={styles.navLinks}>
					<a href="/softinsa#sobre">{t('softinsaSite.nav.sobre')}</a>
					<a href="/softinsa#funcionalidades">{t('softinsaSite.nav.funcionalidades')}</a>
					<a href="/softinsa#badges">{t('softinsaSite.nav.badges')}</a>
					<a href="/softinsa#perfis">{t('softinsaSite.nav.perfis')}</a>
					<a href="/softinsa#fluxo">{t('softinsaSite.nav.comoFunciona')}</a>
				</nav>
				<div className={styles.navRight}>
					<PreferencesBar className={styles.prefsInline} />
					<Link to="/" className={styles.navCta}>{t('softinsaSite.nav.aceder')}</Link>
				</div>
			</div>
		</header>
	);
}
