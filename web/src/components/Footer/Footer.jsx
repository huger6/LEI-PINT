import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../hooks/userContext';
import { useLanguageContext } from '../../context/LanguageContext';
import styles from './Footer.module.css';
import Icon from '../Icons/Icons';

/** Application footer with navigation columns, language switcher, and social links. */
const Footer = () => {
    const { t, i18n } = useTranslation();
    const { lang, handleLanguageChange, user } = useUser();
    const { languages } = useLanguageContext();
    const currentYear = new Date().getFullYear();

    const isAdmin = user?.role === 'Administrator';
    const isConsultant = user?.role === 'Consultant';

    // Badge catalogue lives at a different path per role.
    const catalogHref = isConsultant ? '/catalog'
        : isAdmin ? '/admin/badges'
            : '/badges';

    // Learning Paths structure page path per role.
    const structureHref = isAdmin
        ? '/admin/structure/learning-paths'
        : '/structure/learning-paths';

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

                    {/* Brand */}
                    <div className="col-lg-3 col-md-12 mb-4 mb-lg-0">
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

                    {/* Explore */}
                    <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.platformTitle')}</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2"><a href={catalogHref} className={styles.footerLink}>{t('footer.platformCatalog')}</a></li>
                            <li className="mb-2"><a href={structureHref} className={styles.footerLink}>{t('footer.platformPaths')}</a></li>
                            <li className="mb-2"><a href="/ranking" className={styles.footerLink}>{t('footer.platformRanking')}</a></li>
                            <li className="mb-2"><a href="/announcements" className={styles.footerLink}>{t('footer.platformAnnouncements')}</a></li>
                        </ul>
                    </div>

                    {/* My Account */}
                    <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.accountTitle')}</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2"><a href="/profile" className={styles.footerLink}>{t('footer.accountProfile')}</a></li>
                            <li className="mb-2"><a href="/settings" className={styles.footerLink}>{t('footer.accountSettings')}</a></li>
                            <li className="mb-2"><a href="/applications" className={styles.footerLink}>{t('footer.accountApplications')}</a></li>
                            <li className="mb-2"><a href="/mail-signature" className={styles.footerLink}>{t('footer.accountMailSignature')}</a></li>
                            {isConsultant && (
                                <li className="mb-2"><a href="/store" className={styles.footerLink}>{t('footer.accountStore')}</a></li>
                            )}
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                        <h5 className={styles.footerTitle}>{t('footer.supportTitle')}</h5>
                        <ul className="list-unstyled mb-0">
                            <li className="mb-2"><a href="/policies" className={styles.footerLink}>{t('footer.supportPolicies')}</a></li>
                            <li className="mb-2"><a href="/privacy" className={styles.footerLink}>{t('footer.supportPrivacy')}</a></li>
                            <li className="mb-2"><a href="/security" className={styles.footerLink}>{t('footer.supportSecurity')}</a></li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div className="col-lg-3 col-md-6">
                        <h5 className={styles.footerTitle}>{t('footer.connectivityTitle')}</h5>
                        <p className={styles.footerText}>
                            {t('footer.connectivityDescription')}
                        </p>
                        <ul className="list-inline mt-3 mb-0">
                            <li className="list-inline-item">
                                <a href="/softinsa" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label={t('footer.website')}>
                                    <Icon
                                        name="language"
                                        size={16}
                                        color="currentColor"
                                        aria-label={t('footer.website')}
                                        fill="currentColor"
                                        stroke="none"
                                    />
                                </a>
                            </li>
                            <li className="list-inline-item mr-2">
                                <a href="https://www.linkedin.com/company/softinsa/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="LinkedIn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-linkedin" viewBox="0 0 16 16" aria-hidden="true">
                                        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
                                    </svg>
                                </a>
                            </li>
                            <li className="list-inline-item mr-2">
                                <a href="https://teams.microsoft.com/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Microsoft Teams">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-microsoft-teams" viewBox="0 0 16 16" aria-hidden="true">
                                        <path d="M9.186 4.797a2.42 2.42 0 1 0-2.86-2.448h1.178c.929 0 1.682.753 1.682 1.682zm-4.295 7.738h2.613c.929 0 1.682-.753 1.682-1.682V5.58h2.783a.7.7 0 0 1 .682.716v4.294a4.197 4.197 0 0 1-4.093 4.293c-1.618-.04-3-.99-3.667-2.35Zm10.737-9.372a1.674 1.674 0 1 1-3.349 0 1.674 1.674 0 0 1 3.349 0m-2.238 9.488-.12-.002a5.2 5.2 0 0 0 .381-2.07V6.306a1.7 1.7 0 0 0-.15-.725h1.792c.39 0 .707.317.707.707v3.765a2.6 2.6 0 0 1-2.598 2.598z" />
                                        <path d="M.682 3.349h6.822c.377 0 .682.305.682.682v6.822a.68.68 0 0 1-.682.682H.682A.68.68 0 0 1 0 10.853V4.03c0-.377.305-.682.682-.682Zm5.206 2.596v-.72h-3.59v.72h1.357V9.66h.87V5.945z" />
                                    </svg>
                                </a>
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
