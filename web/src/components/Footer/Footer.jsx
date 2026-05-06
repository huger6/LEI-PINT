import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

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
                            <span className={styles.languageBadge}>{t('footer.languagePt')}</span>
                            <span className={styles.languageBadge}>{t('footer.languageEn')}</span>
                            <span className={styles.languageBadge}>{t('footer.languageEs')}</span>
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
