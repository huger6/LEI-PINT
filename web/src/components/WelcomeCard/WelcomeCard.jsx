import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUser } from '../../hooks/userContext';
import styles from './WelcomeCard.module.css';
import StatCard from './StatCard/StatCard';
import Icon from '../Icons/Icons';

function getGreeting(t, authUser) {
    if (authUser?.first_login) {
        return t('welcomeCard.welcomeFirstLogin');
    }

    if (authUser?.last_online) {
        const diffMs = Date.now() - new Date(authUser.last_online).getTime();
        if (diffMs > 15 * 24 * 60 * 60 * 1000) {
            return t('welcomeCard.welcomeBack');
        }
    }

    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return t('welcomeCard.goodMorning');
    if (hour >= 13 && hour < 20) return t('welcomeCard.goodAfternoon');
    return t('welcomeCard.goodEvening');
}

function toSlug(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function buildPath(basePath, value) {
    const slug = toSlug(value);
    if (slug) return `${basePath}/${slug}`;
    return `${basePath}/${encodeURIComponent(String(value ?? '').trim().toLowerCase())}`;
}

export default function WelcomeCard() {
    const { t } = useTranslation();
    const { user: authUser } = useAuth();
    const { user, displayName } = useUser();

    const greeting = getGreeting(t, authUser);
    const serviceLine = user?.serviceLine?.name;
    const primaryArea = user?.areas?.find(a => a.isPrimary)?.name || user?.areas?.[0]?.name;
    const streakDays = user?.currentStreakDays ?? authUser?.current_streak_days ?? 0;
    const serviceLinePath = buildPath('/service-lines', serviceLine);
    const primaryAreaPath = buildPath('/areas', primaryArea);

    const stats = [
        { label: t('welcomeCard.badgesEarned'), value: '-', variant: 'accent' },
        { label: t('welcomeCard.activeBadges'), value: '-' },
        { label: t('welcomeCard.streak'), value: `${streakDays} ${t('welcomeCard.days')}`, variant: 'success' },
    ];

    return (
        <section className={`${styles.card} p-3 p-md-4 px-xl-5`}>
            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <p className={`${styles.welcomeText} mb-0`}>{greeting}</p>
                    <h2 className={`${styles.userName} mb-0`}>{displayName}</h2>

                    <div className={`d-flex flex-column flex-md-row ${styles.metaList}`}>
                        {serviceLine && (
                            <Link to={serviceLinePath} className={`${styles.metaItem} ${styles.metaLink}`}>
                                <Icon name="service-line" className={styles.metaIcon} aria-hidden="true" color='#fff' />
                                <p className={`${styles.metaText} mb-0`}>
                                    <span className={styles.metaHighlight}>{serviceLine}</span>
                                </p>
                            </Link>
                        )}

                        {primaryArea && (
                            <Link to={primaryAreaPath} className={`${styles.metaItem} ${styles.metaLink}`}>
                                <Icon name="area" className={styles.metaIcon} aria-hidden="true" size={24} color='#fff' />
                                <p className={`${styles.metaText} mb-0`}>
                                    <span className={styles.metaHighlight}>{primaryArea}</span>
                                </p>
                            </Link>
                        )}
                    </div>
                </div>

                <div className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        {stats.map((stat) => (
                            <StatCard key={stat.label} {...stat} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
