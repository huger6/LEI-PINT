import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useUser } from '../../hooks/userContext';
import { getApplicationsPaged } from '../../features/applications/api/applicationsApi';
import { getConsultantsOverview, getBadgesSummary } from '../../features/statistics/api/statisticsApi';
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
        .replace(/[̀-ͯ]/g, '')
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

// Service line / area meta shown to a consultant (unchanged behaviour).
function ConsultantMeta({ user }) {
    const serviceLine = user?.serviceLine?.name;
    const primaryArea = user?.areas?.find(a => a.isPrimary)?.name || user?.areas?.[0]?.name;
    return (
        <div className={`d-flex flex-column flex-md-row ${styles.metaList}`}>
            {serviceLine && (
                <Link to={buildPath('/service-lines', serviceLine)} className={`${styles.metaItem} ${styles.metaLink}`}>
                    <Icon name="service-line" className={styles.metaIcon} aria-hidden="true" color="#fff" />
                    <p className={`${styles.metaText} mb-0`}><span className={styles.metaHighlight}>{serviceLine}</span></p>
                </Link>
            )}
            {primaryArea && (
                <Link to={buildPath('/areas', primaryArea)} className={`${styles.metaItem} ${styles.metaLink}`}>
                    <Icon name="area" className={styles.metaIcon} aria-hidden="true" size={24} color="#fff" />
                    <p className={`${styles.metaText} mb-0`}><span className={styles.metaHighlight}>{primaryArea}</span></p>
                </Link>
            )}
        </div>
    );
}

export default function WelcomeCard() {
    const { t } = useTranslation();
    const { user: authUser } = useAuth();
    const { user, displayName } = useUser();

    const role = user?.role;
    const isTm = role === 'Talent Manager';
    const isSll = role === 'Service Line Leader';
    const isLeader = isTm || isSll;
    const isAdmin = role === 'Administrator';

    const [leaderStats, setLeaderStats] = useState(null);

    useEffect(() => {
        if (!isLeader) return undefined;
        let active = true;
        (async () => {
            const pendingState = isSll ? 'In validation' : 'Submitted';
            const [pending, consultants, badges] = await Promise.all([
                getApplicationsPaged({ state: pendingState, page: 1, limit: 1 }).then(r => r.pagination?.total ?? 0).catch(() => 0),
                getConsultantsOverview({ page: 1, limit: 1 }).then(r => r.pagination?.totalItems ?? 0).catch(() => 0),
                getBadgesSummary({}).then(s => s.total ?? 0).catch(() => 0),
            ]);
            if (active) setLeaderStats({ pending, consultants, badges });
        })();
        return () => { active = false; };
    }, [isLeader, isSll]);

    const greeting = getGreeting(t, authUser);
    const serviceLine = user?.serviceLine?.name;
    const streakDays = user?.currentStreakDays ?? authUser?.current_streak_days ?? 0;

    const leaderValue = (v) => (leaderStats ? v : '—');
    const stats = isAdmin
        ? []
        : isLeader
        ? [
            { label: t('welcomeCard.pendingValidations'), value: leaderValue(leaderStats?.pending), variant: 'accent', icon: 'paper' },
            { label: t('welcomeCard.consultants'), value: leaderValue(leaderStats?.consultants), icon: 'tabler_users' },
            { label: t('welcomeCard.badgesAwarded'), value: leaderValue(leaderStats?.badges), variant: 'success', icon: 'badge' },
        ]
        : [
            { label: t('welcomeCard.badgesEarned'), value: '-', variant: 'accent', icon: 'badge' },
            { label: t('welcomeCard.activeApplications'), value: '-', icon: 'paper' },
            { label: t('welcomeCard.streak'), value: `${streakDays} ${t('welcomeCard.days')}`, variant: 'success', icon: 'fire' },
        ];

    return (
        <section className={`${styles.card} p-3 p-md-4 px-xl-5`}>
            <div className={styles.content}>
                <div className={styles.mainContent}>
                    <p className={`${styles.welcomeText} mb-0`}>{greeting}</p>
                    <h2 className={`${styles.userName} mb-0`}>{displayName}</h2>

                    {isLeader ? (
                        <div className={`d-flex flex-column flex-md-row ${styles.metaList}`}>
                            <span className={styles.metaItem}>
                                <span className={`${styles.metaText} mb-0`}>
                                    <span className={styles.metaHighlight}>{t(isSll ? 'welcomeCard.roleSll' : 'welcomeCard.roleTm')}</span>
                                </span>
                            </span>
                            {isSll && serviceLine && (
                                <span className={styles.metaItem}>
                                    <Icon name="service-line" className={styles.metaIcon} aria-hidden="true" color="#fff" />
                                    <span className={`${styles.metaText} mb-0`}>
                                        <span className={styles.metaHighlight}>{serviceLine}</span>
                                    </span>
                                </span>
                            )}
                        </div>
                    ) : isAdmin ? (
                        <div className={`d-flex flex-column flex-md-row ${styles.metaList}`}>
                            <span className={styles.metaItem}>
                                <span className={`${styles.metaText} mb-0`}>
                                    <span className={styles.metaHighlight}>{t('welcomeCard.roleAdmin', { defaultValue: 'Administrador' })}</span>
                                </span>
                            </span>
                        </div>
                    ) : (
                        <ConsultantMeta user={user} />
                    )}
                </div>

                {stats.length > 0 && (
                    <div className={styles.statsSection}>
                        <div className={styles.statsGrid}>
                            {stats.map((stat) => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
