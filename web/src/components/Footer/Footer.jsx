import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../hooks/userContext';
import { useLanguages } from '../../hooks/useLanguages';
import styles from './Footer.module.css';

const Footer = () => {
    const { t, i18n } = useTranslation();
    const { lang, handleLanguageChange } = useUser();
    const { languages } = useLanguages();
    const currentYear = new Date().getFullYear();

    // activeLang seeds from lang.iso (same DB value as language_iso) so the
    // comparison is exact; updated optimistically on click for instant feedback.
    const [activeLang, setActiveLang] = useState(lang?.iso ?? null);

    useEffect(() => {
        if (lang?.iso) setActiveLang(lang.iso);
    }, [lang?.iso]);

    // Sync i18n with the user's stored preferred language on login/load
    useEffect(() => {
        if (lang?.iso) i18n.changeLanguage(lang.iso);
    }, [lang?.iso, i18n]);

    return (
        <footer className={`${styles.footerContainer} container-fluid`}>
            <div className="container px-5">
                <div className="row py-5">
                    <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.brandTitle')}</h5>
                        <p className={styles.footerText}>
                            {t('footer.brandDescription')}
                        </p>
                        <div className={styles.languageSwitcher}>
                            {languages.map(({ language_id, language_iso }) => (
                                <span
                                    key={language_id}
                                    className={`${styles.languageBadge} ${activeLang === language_iso ? styles.languageBadgeActive : ''}`}
                                    onClick={() => { setActiveLang(language_iso); handleLanguageChange(language_id, language_iso); }}
                                >
                                    {language_iso.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.platformTitle')}</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2"><a href="/catalog" className={styles.footerLink}>{t('footer.platformCatalog')}</a></li>
                            <li className="mb-2"><a href="/paths" className={styles.footerLink}>{t('footer.platformPaths')}</a></li>
                            <li className="mb-2"><a href="/ranking" className={styles.footerLink}>{t('footer.platformRanking')}</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.supportTitle')}</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2"><a href="/help" className={styles.footerLink}>{t('footer.supportHelp')}</a></li>
                            <li className="mb-2"><a href="/privacy" className={styles.footerLink}>{t('footer.supportPrivacy')}</a></li>
                            <li className="mb-2"><a href="/terms" className={styles.footerLink}>{t('footer.supportTerms')}</a></li>
                        </ul>
                    </div>

                    <div className="col-lg-4 col-md-6">
                        <h5 className={styles.footerTitle}>{t('footer.connectivityTitle')}</h5>
                        <p className={styles.footerText}>
                            {t('footer.connectivityDescription')}
                        </p>
                        <ul className="list-inline mt-3 mb-0">
                            <li className="list-inline-item mr-2">
                                <a href="#" className={styles.socialIcon}><i className="fab fa-linkedin"></i></a>
                            </li>
                            <li className="list-inline-item mr-2">
                                <a href="#" className={styles.socialIcon}><i className="fab fa-microsoft"></i></a>
                            </li>
                            <li className="list-inline-item">
                                <a href="#" className={styles.socialIcon}><i className="fab fa-slack"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={`${styles.bottomBar} py-3 px-5`}>
                <div className="container text-center">
                    <p className="mb-0">
                        {t('footer.copyright', { year: currentYear })}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
