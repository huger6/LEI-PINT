import { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import ContentCard from '../../../components/ContentCard/ContentCard';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import Icon from '../../../components/Icons/Icons';
import { getConsultantStats, getPointsHistoryAll, getLearningPathProgress, getRanking } from '../../../services/pointsService';
import { CONSULTANT } from '../../../routes/paths';
import { getProgressionTimeline } from '../../../features/goals/api/goalsApi';
import { fetchNotifications } from '../../../features/notifications/api/notificationsApi';
import { getBadgesPerArea, getApplicationsWithPagination, getEarnedBadgesForEvolution } from '../../../features/evolution/api/evolutionApi';
import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip,
} from 'recharts';
import styles from './Evolution.module.css';

const ACHIEVEMENT_COLORS = [
    'var(--color-warning)',
    'var(--color-error)',
    'var(--color-success)',
    'var(--color-primary)',
    'var(--color-secondary)',
];

const LP_COLORS = [
    'var(--color-primary)',
    'var(--color-warning)',
    'var(--color-success)',
    'var(--color-secondary)',
    'var(--color-error)',
];

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getGreeting(t) {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return t('welcomeCard.goodMorning');
    if (hour >= 13 && hour < 20) return t('welcomeCard.goodAfternoon');
    return t('welcomeCard.goodEvening');
}

function formatValidationTime(avgMs, t) {
    if (!avgMs || avgMs <= 0) return '—';
    const totalHours = Math.floor(avgMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

function computeAppStats(applications) {
    const total = applications.length;
    const accepted = applications.filter(a => a.application_state === 'Accepted').length;
    const rejected = applications.filter(a => a.application_state === 'Rejected').length;
    const closed = accepted + rejected;
    const approvalRate = closed > 0 ? Math.round((accepted / closed) * 100) : 0;

    const validationTimes = applications
        .filter(a => (a.application_state === 'Accepted' || a.application_state === 'Rejected') && a.submitted_at && a.closed_at)
        .map(a => new Date(a.closed_at) - new Date(a.submitted_at))
        .filter(ms => ms > 0);

    const avgValidationMs = validationTimes.length > 0
        ? validationTimes.reduce((sum, ms) => sum + ms, 0) / validationTimes.length
        : 0;

    return { total, approvalRate, avgValidationMs };
}

function deriveAverageLevel(timeline) {
    if (!timeline || timeline.length === 0) return { code: '—', title: '' };
    const sorted = [...timeline].sort((a, b) => (b.stage_sequence ?? 0) - (a.stage_sequence ?? 0));
    const highest = sorted.find(s => s.earned_badges > 0);
    if (!highest) return { code: '—', title: '' };
    return { code: highest.code, title: highest.title };
}

function buildBadgeEvolutionMonthly(earnedBadges, t) {
    const counts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    earnedBadges.forEach(b => {
        if (!b.awardedDate) return;
        const d = new Date(b.awardedDate);
        if (d.getFullYear() === currentYear) {
            counts[d.getMonth()]++;
        }
    });
    return counts.map((val, i) => ({ name: t(`shared.months.${MONTH_KEYS[i]}`), value: val }));
}

function buildBadgeEvolutionAnnual(earnedBadges) {
    const yearMap = {};
    earnedBadges.forEach(b => {
        if (!b.awardedDate) return;
        const year = new Date(b.awardedDate).getFullYear();
        yearMap[year] = (yearMap[year] || 0) + 1;
    });
    const years = Object.keys(yearMap).sort();
    return years.map(y => ({ name: y, value: yearMap[y] }));
}

function buildPointsWeekly(pointsHistory, t) {
    const counts = new Array(7).fill(0);
    pointsHistory.forEach(p => {
        const d = new Date(p.created_at);
        counts[d.getDay()] += parseInt(p.points_delta, 10) || 0;
    });
    return counts.map((val, i) => ({ name: t(`shared.days.${DAY_KEYS[i]}`), value: val }));
}

function buildPointsMonthly(pointsHistory, t) {
    const counts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    pointsHistory.forEach(p => {
        const d = new Date(p.created_at);
        // Only the current year, so months from different years don't merge.
        if (d.getFullYear() === currentYear) {
            counts[d.getMonth()] += parseInt(p.points_delta, 10) || 0;
        }
    });
    return counts.map((val, i) => ({ name: t(`shared.months.${MONTH_KEYS[i]}`), value: val }));
}

function mapNotificationToActivity(notification, t) {
    const defName = notification.definition?.name || notification.definition?.code || '';
    const defCode = (notification.definition?.code || '').toLowerCase();

    let payload = {};
    if (notification.notification_payload) {
        try { payload = JSON.parse(notification.notification_payload); } catch { /* ignore */ }
    }

    const meta = payload.meta || {};
    const rawTitle = payload.title || defName;
    const translatedTitle = t(rawTitle, { ns: 'api', defaultValue: rawTitle, ...meta });
    const title = translatedTitle || rawTitle;

    const rawBody = payload.body || '';
    const translatedBody = rawBody ? t(rawBody, { ns: 'api', defaultValue: '', ...meta }) : '';
    const description = translatedBody || notification.definition?.description || '';

    let icon = 'bell';
    let iconColor = 'var(--color-outline)';
    const type = notification.notification_type;

    if (type === 'BADGES' || defCode.includes('badge')) {
        icon = 'badge';
        iconColor = 'var(--color-primary)';
    } else if (type === 'APPLICATIONS' || defCode.includes('application')) {
        icon = 'paper';
        iconColor = 'var(--color-secondary)';
    } else if (type === 'POINTS' || defCode.includes('point')) {
        icon = 'star-points';
        iconColor = 'var(--color-warning)';
    } else if (type === 'ACHIEVEMENTS' || defCode.includes('achievement') || defCode.includes('award')) {
        icon = 'trophy';
        iconColor = 'var(--color-success)';
    } else if (type === 'EVOLUTION') {
        icon = 'evolution';
        iconColor = 'var(--color-primary)';
    }

    return { title, description, icon, iconColor, sentAt: notification.sent_at };
}

function computeDeltas(earnedBadges, applications, pointsHistory) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const badgesDelta = earnedBadges.filter(b =>
        b.awardedDate && new Date(b.awardedDate) >= weekAgo
    ).length;

    const progressDelta = applications.filter(a =>
        a.application_state === 'Open' && a.opened_at && new Date(a.opened_at) >= weekAgo
    ).length;

    const pointsDelta = pointsHistory
        .filter(p => p.created_at && new Date(p.created_at) >= weekAgo)
        .reduce((sum, p) => sum + (parseInt(p.points_delta, 10) || 0), 0);

    return { badgesDelta, progressDelta, pointsDelta };
}

function formatBadgeDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-PT', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

function formatTimeAgo(dateStr, t) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return t('evolution.minutesAgo', { count: Math.max(1, minutes) });
    if (hours < 24) return t('evolution.hoursAgo', { count: hours });
    return t('evolution.daysAgo', { count: days });
}

export default function Evolution() {
    const { t } = useTranslation();
    const { user: authUser } = useAuth();
    const { displayName } = useUser();
    const [badgeChartMode, setBadgeChartMode] = useState('monthly');
    const [pointsChartMode, setPointsChartMode] = useState('weekly');

    const [stats, setStats] = useState(null);
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [badgesPerArea, setBadgesPerArea] = useState([]);
    const [applications, setApplications] = useState([]);
    const [appTotal, setAppTotal] = useState(0);
    const [pointsHistory, setPointsHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [learningPaths, setLearningPaths] = useState([]);
    const [rankPercentile, setRankPercentile] = useState(null);

    useEffect(() => {
        getConsultantStats()
            .then(setStats)
            .catch(() => setStats(null));

        getEarnedBadgesForEvolution()
            .then(setEarnedBadges)
            .catch(() => setEarnedBadges([]));

        getProgressionTimeline()
            .then(setTimeline)
            .catch(() => setTimeline([]));

        getBadgesPerArea()
            .then(setBadgesPerArea)
            .catch(() => setBadgesPerArea([]));

        getApplicationsWithPagination({ limit: 200 })
            .then(res => {
                setApplications(res.applications);
                setAppTotal(res.pagination?.total ?? res.applications.length);
            })
            .catch(() => { setApplications([]); setAppTotal(0); });

        getPointsHistoryAll()
            .then(setPointsHistory)
            .catch(() => setPointsHistory([]));

        fetchNotifications({ limit: 5 })
            .then(res => {
                const list = res?.data?.data || res?.data || [];
                setNotifications(Array.isArray(list) ? list.slice(0, 5) : []);
            })
            .catch(() => setNotifications([]));

        getLearningPathProgress()
            .then(setLearningPaths)
            .catch(() => setLearningPaths([]));

        Promise.all([getConsultantStats(), getRanking({ limit: 1 })])
            .then(([statsData, rankData]) => {
                const position = statsData?.rankingPosition;
                const total = rankData?.pagination?.total || rankData?.pagination?.totalItems;
                if (position && total && total > 1) {
                    setRankPercentile(Math.round((1 - (position - 1) / total) * 100));
                }
            })
            .catch(() => {});
    }, []);

    const greeting = `${getGreeting(t).replace(/[!！]\s*$/, '')}, ${displayName || authUser?.name || t('evolution.user')}!`;
    const averageLevel = useMemo(() => deriveAverageLevel(timeline), [timeline]);
    const competenciesCount = badgesPerArea.length;
    const appStats = useMemo(() => computeAppStats(applications), [applications]);
    const deltas = useMemo(() => computeDeltas(earnedBadges, applications, pointsHistory), [earnedBadges, applications, pointsHistory]);

    const badgeEvolutionMonthly = useMemo(() => buildBadgeEvolutionMonthly(earnedBadges, t), [earnedBadges, t]);
    const badgeEvolutionAnnual = useMemo(() => buildBadgeEvolutionAnnual(earnedBadges), [earnedBadges]);
    const badgeChartData = badgeChartMode === 'monthly' ? badgeEvolutionMonthly : badgeEvolutionAnnual;

    const pointsWeekly = useMemo(() => buildPointsWeekly(pointsHistory, t), [pointsHistory, t]);
    const pointsMonthly = useMemo(() => buildPointsMonthly(pointsHistory, t), [pointsHistory, t]);
    const pointsChartData = pointsChartMode === 'weekly' ? pointsWeekly : pointsMonthly;

    const radarData = useMemo(() => {
        if (!timeline || timeline.length === 0) return [];
        const codeMap = new Map();
        for (const s of timeline) {
            const existing = codeMap.get(s.code);
            if (existing) {
                existing.value += (s.earned_badges || 0);
                existing.stage_sequence = Math.min(existing.stage_sequence, s.stage_sequence ?? 0);
            } else {
                codeMap.set(s.code, { level: s.code, value: s.earned_badges || 0, stage_sequence: s.stage_sequence ?? 0 });
            }
        }
        return Array.from(codeMap.values()).sort((a, b) => a.stage_sequence - b.stage_sequence);
    }, [timeline]);

    const radarMax = useMemo(() => {
        if (radarData.length === 0) return 1;
        return Math.max(1, ...radarData.map(r => r.value));
    }, [radarData]);

    const activities = useMemo(() => notifications.map(n => mapNotificationToActivity(n, t)), [notifications, t]);
    const recentAchievements = useMemo(() => earnedBadges.slice(0, 3), [earnedBadges]);

    const statCards = [
        { key: 'badgesObtained', icon: 'badge', value: stats?.earnedBadges ?? '—', delta: deltas.badgesDelta },
        { key: 'badgesInProgress', icon: 'progress', value: stats?.badgesInProgress ?? '—', delta: deltas.progressDelta },
        { key: 'skillsAcquired', icon: 'skills', value: competenciesCount ?? '—', delta: null },
        { key: 'totalPoints', icon: 'star-points', value: stats?.totalPoints != null ? stats.totalPoints.toLocaleString('pt-PT') : '—', delta: deltas.pointsDelta },
        { key: 'averageLevel', icon: 'evolution', value: averageLevel.code, levelTitle: averageLevel.title, delta: null },
    ];

    return (
        <div className={styles.page}>
            {/* Welcome Header */}
            <section className={styles.welcomeSection}>
                <h1 className={styles.greeting}>{greeting}</h1>
                {rankPercentile != null && (
                    <p className={styles.subtitle}>
                        <Trans
                            i18nKey="evolution.subtitle"
                            values={{ percentage: String(rankPercentile) }}
                            components={{ highlight: <Link to={CONSULTANT.RANKING} /> }}
                        />
                    </p>
                )}
            </section>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                {statCards.map((stat) => (
                    <EvolutionStatCard key={stat.key} stat={stat} t={t} />
                ))}
            </div>

            {/* Charts Row */}
            <div className={styles.chartsRow}>
                <ContentCard className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h2 className={styles.cardTitle}>{t('evolution.badgeEvolution')}</h2>
                        <TogglePill
                            options={[
                                { key: 'monthly', label: t('evolution.monthly') },
                                { key: 'annual', label: t('evolution.annual') },
                            ]}
                            active={badgeChartMode}
                            onChange={setBadgeChartMode}
                        />
                    </div>
                    <LineAreaChart
                        data={badgeChartData}
                        xAxisKey="name"
                        yAxisKey="value"
                        height={250}
                    />
                </ContentCard>

                <ContentCard className={styles.radarCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.badgesByLevel')}</h2>
                    {radarData.length > 0 ? (
                        <div className={styles.radarWrapper}>
                            <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="rgba(57, 99, 156, 0.15)" />
                                    <PolarAngleAxis
                                        dataKey="level"
                                        tick={{ fontSize: 11, fill: 'var(--color-outline)' }}
                                    />
                                    <PolarRadiusAxis
                                        angle={90}
                                        domain={[0, radarMax]}
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Tooltip />
                                    <Radar
                                        dataKey="value"
                                        stroke="var(--color-primary)"
                                        fill="rgba(0, 184, 224, 0.2)"
                                        strokeWidth={2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className={styles.emptyText}>{t('evolution.noData')}</p>
                    )}
                </ContentCard>
            </div>

            {/* Applications & Points Row */}
            <div className={styles.middleRow}>
                <ContentCard className={styles.applicationsCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.applications')}</h2>
                    <div className={styles.appStatsList}>
                        <div className={`${styles.appStatItem} ${styles.appStatPrimary}`}>
                            <div className={styles.appStatIcon}>
                                <Icon name="clock" size={20} color="var(--color-primary)" />
                            </div>
                            <div className={styles.appStatContent}>
                                <span className={styles.appStatLabel}>{t('evolution.avgValidationTime')}</span>
                                <span className={`${styles.appStatValue} ${styles.valuePrimary}`}>
                                    {formatValidationTime(appStats.avgValidationMs, t)}
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.appStatItem} ${styles.appStatSuccess}`}>
                            <div className={styles.appStatIcon}>
                                <Icon name="check_circle" size={20} color="var(--color-success)" />
                            </div>
                            <div className={styles.appStatContent}>
                                <span className={styles.appStatLabel}>{t('evolution.approvalRate')}</span>
                                <span className={`${styles.appStatValue} ${styles.valueSuccess}`}>
                                    {appStats.approvalRate}%
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.appStatItem} ${styles.appStatSecondary}`}>
                            <div className={styles.appStatIcon}>
                                <Icon name="paper" size={20} color="var(--color-secondary)" />
                            </div>
                            <div className={styles.appStatContent}>
                                <span className={styles.appStatLabel}>{t('evolution.applicationsMade')}</span>
                                <span className={`${styles.appStatValue} ${styles.valueSecondary}`}>
                                    {appTotal}
                                </span>
                            </div>
                        </div>
                    </div>
                </ContentCard>

                <ContentCard className={styles.pointsCard}>
                    <div className={styles.chartHeader}>
                        <h2 className={styles.cardTitle}>{t('evolution.points')}</h2>
                        <TogglePill
                            options={[
                                { key: 'weekly', label: t('evolution.weekly') },
                                { key: 'monthly', label: t('evolution.monthlyLabel') },
                            ]}
                            active={pointsChartMode}
                            onChange={setPointsChartMode}
                        />
                    </div>
                    <VerticalBarChart
                        data={pointsChartData}
                        xAxisKey="name"
                        yAxisKey="value"
                        height={250}
                    />
                </ContentCard>
            </div>

            {/* Bottom Row */}
            <div className={styles.bottomRow}>
                <ContentCard className={styles.activityCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.recentActivity')}</h2>
                    <div className={styles.activityList}>
                        {activities.length > 0 ? activities.map((activity, idx) => (
                            <div key={idx} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    <Icon name={activity.icon} size={18} color={activity.iconColor} />
                                </div>
                                <div className={styles.activityContent}>
                                    <span className={styles.activityTitle}>{activity.title}</span>
                                    <span className={styles.activityDesc}>{activity.description}</span>
                                </div>
                                <span className={styles.activityTime}>
                                    {formatTimeAgo(activity.sentAt, t)}
                                </span>
                            </div>
                        )) : (
                            <p className={styles.emptyText}>{t('evolution.noActivity')}</p>
                        )}
                    </div>
                </ContentCard>

                <ContentCard className={styles.achievementsCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.specialAchievements')}</h2>
                    <div className={styles.achievementsList}>
                        {recentAchievements.length > 0 ? recentAchievements.map((badge, idx) => {
                            const color = ACHIEVEMENT_COLORS[idx % ACHIEVEMENT_COLORS.length];
                            return (
                                <div
                                    key={badge.awardedBadgeId}
                                    className={styles.achievementItem}
                                    style={{ borderLeftColor: color }}
                                >
                                    <div className={styles.achievementIcon}>
                                        <Icon name={badge.isFeatured ? 'star' : 'trophy'} size={18} color={color} />
                                    </div>
                                    <div className={styles.achievementContent}>
                                        <span className={styles.achievementTitle}>
                                            {badge.badge?.title || t('evolution.badge')}
                                        </span>
                                        <span className={styles.achievementDesc}>
                                            {formatBadgeDate(badge.awardedDate)}
                                            {badge.pointsSnapshot ? ` · ${badge.pointsSnapshot} pts` : ''}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className={styles.emptyText}>{t('evolution.noAchievements')}</p>
                        )}
                    </div>
                </ContentCard>

                <ContentCard className={styles.learningPathsCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.learningPaths')}</h2>
                    <div className={styles.lpList}>
                        {learningPaths.length > 0 ? learningPaths
                            .filter(lp => lp.total_badges > 0)
                            .map((lp, idx) => {
                                const pct = Math.round(parseFloat(lp.progress_pct) || 0);
                                const color = LP_COLORS[idx % LP_COLORS.length];
                                return (
                                    <div key={lp.learning_path_id || idx} className={styles.lpItem}>
                                        <div className={styles.lpHeader}>
                                            <div className={styles.lpInfo}>
                                                <div
                                                    className={styles.lpIcon}
                                                    style={{ backgroundColor: color }}
                                                />
                                                <div>
                                                    <span className={styles.lpName}>{lp.path_title}</span>
                                                    <span className={styles.lpBadges}>
                                                        {lp.earned_badges}/{lp.total_badges} badges
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={styles.lpPercentage} style={{ color }}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className={styles.lpProgressTrack}>
                                            <div
                                                className={styles.lpProgressFill}
                                                style={{ width: `${pct}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            }) : (
                            <p className={styles.emptyText}>{t('evolution.noData')}</p>
                        )}
                    </div>
                </ContentCard>
            </div>
        </div>
    );
}

function EvolutionStatCard({ stat, t }) {
    const colorMap = {
        badgesObtained: 'var(--color-primary)',
        badgesInProgress: 'var(--color-on-background)',
        skillsAcquired: 'var(--color-on-background)',
        totalPoints: 'var(--color-warning)',
        averageLevel: 'var(--color-on-background)',
    };
    const valueColor = colorMap[stat.key] || 'var(--color-on-background)';

    return (
        <ContentCard className={styles.statCard}>
            <div className={styles.statTop}>
                <div className={styles.statIconWrap}>
                    <Icon name={stat.icon} size={22} color="var(--color-primary)" />
                </div>
                {stat.delta > 0 && (
                    <span className={styles.statDelta}>+{stat.delta}</span>
                )}
            </div>
            <span className={styles.statLabel}>{t(`evolution.stats.${stat.key}`)}</span>
            <span className={styles.statValue} style={{ color: valueColor }}>
                {stat.key === 'averageLevel' && stat.levelTitle
                    ? <>{stat.value} <span className={styles.statLevelLabel}>({stat.levelTitle})</span></>
                    : stat.value
                }
            </span>
        </ContentCard>
    );
}

function TogglePill({ options, active, onChange }) {
    return (
        <div className={styles.togglePill}>
            {options.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    className={`${styles.toggleBtn} ${active === opt.key ? styles.toggleActive : ''}`}
                    onClick={() => onChange(opt.key)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
