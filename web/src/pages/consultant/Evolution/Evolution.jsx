import { useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import ContentCard from '../../../components/ContentCard/ContentCard';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import Icon from '../../../components/Icons/Icons';
import {
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from 'recharts';
import styles from './Evolution.module.css';

const MOCK_STATS = [
    { key: 'badgesObtained', icon: 'badge', delta: '+3', value: '9' },
    { key: 'badgesInProgress', icon: 'progress', delta: '+2', value: '4' },
    { key: 'skillsAcquired', icon: 'check_circle', delta: '+5', value: '20' },
    { key: 'totalPoints', icon: 'star-points', delta: '+180', value: '1.267' },
    { key: 'averageLevel', icon: 'evolution', delta: null, value: 'C' },
];

const MOCK_BADGE_EVOLUTION_MONTHLY_RAW = [
    { key: 'jan', value: 1 },
    { key: 'feb', value: 2 },
    { key: 'mar', value: 2 },
    { key: 'apr', value: 3 },
    { key: 'may', value: 5 },
    { key: 'jun', value: 6 },
    { key: 'jul', value: 7 },
    { key: 'aug', value: 8 },
    { key: 'sep', value: 9 },
    { key: 'oct', value: 10 },
    { key: 'nov', value: 11 },
    { key: 'dec', value: 9 },
];

const MOCK_BADGE_EVOLUTION_ANNUAL = [
    { name: '2021', value: 2 },
    { name: '2022', value: 5 },
    { name: '2023', value: 8 },
    { name: '2024', value: 12 },
    { name: '2025', value: 18 },
    { name: '2026', value: 9 },
];

const MOCK_RADAR_DATA_RAW = [
    { key: 'expert', value: 2 },
    { key: 'advanced', value: 4 },
    { key: 'senior', value: 6 },
    { key: 'intermediate', value: 8 },
    { key: 'beginner', value: 5 },
];

const MOCK_POINTS_WEEKLY_RAW = [
    { key: 'sun', value: 300 },
    { key: 'mon', value: 800 },
    { key: 'tue', value: 600 },
    { key: 'wed', value: 1200 },
    { key: 'thu', value: 1500 },
    { key: 'fri', value: 900 },
    { key: 'sat', value: 700 },
];

const MOCK_POINTS_MONTHLY_RAW = [
    { key: 'jan', value: 2400 },
    { key: 'feb', value: 1800 },
    { key: 'mar', value: 3200 },
    { key: 'apr', value: 2700 },
    { key: 'may', value: 3500 },
    { key: 'jun', value: 4100 },
    { key: 'jul', value: 2900 },
    { key: 'aug', value: 3800 },
    { key: 'sep', value: 4500 },
    { key: 'oct', value: 3100 },
    { key: 'nov', value: 4200 },
    { key: 'dec', value: 3600 },
];

const MOCK_ACTIVITIES = [
    { icon: 'check_circle', iconColor: 'var(--color-success)', titleKey: 'badgeCompleted', descKey: 'badgeCompletedDesc', timeKey: 'hours2' },
    { icon: 'star-points', iconColor: 'var(--color-warning)', titleKey: 'requirementDone', descKey: 'requirementDoneDesc', timeKey: 'hours5' },
    { icon: 'badge', iconColor: 'var(--color-primary)', titleKey: 'badgeObtainedActivity', descKey: 'badgeObtainedActivityDesc', timeKey: 'day1' },
    { icon: 'badge', iconColor: 'var(--color-primary)', titleKey: 'badgeObtainedActivity2', descKey: 'badgeObtainedActivity2Desc', timeKey: 'days2' },
    { icon: 'paper', iconColor: 'var(--color-secondary)', titleKey: 'badgeSubmitted', descKey: 'badgeSubmittedDesc', timeKey: 'days3' },
];

const MOCK_ACHIEVEMENTS = [
    { titleKey: 'achievement1', descKey: 'achievementDesc1', color: 'var(--color-warning)' },
    { titleKey: 'achievement2', descKey: 'achievementDesc2', color: 'var(--color-error)' },
    { titleKey: 'achievement3', descKey: 'achievementDesc3', color: 'var(--color-success)' },
];

const MOCK_LEARNING_PATHS = [
    {
        nameKey: 'lpTechnical',
        badgesText: '9/15 badges',
        stageKey: 'lpTechnicalStage',
        percentage: 68,
        nextKey: 'lpTechnicalNext',
        color: 'var(--color-primary)',
    },
    {
        nameKey: 'lpSoftSkills',
        badgesText: '7/8 badges',
        stageKey: 'lpSoftSkillsStage',
        percentage: 85,
        nextKey: 'lpSoftSkillsNext',
        color: 'var(--color-warning)',
    },
];

function getGreeting(t) {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return t('welcomeCard.goodMorning');
    if (hour >= 13 && hour < 20) return t('welcomeCard.goodAfternoon');
    return t('welcomeCard.goodEvening');
}

export default function Evolution() {
    const { t } = useTranslation();
    const { user: authUser } = useAuth();
    const { displayName } = useUser();
    const [badgeChartMode, setBadgeChartMode] = useState('monthly');
    const [pointsChartMode, setPointsChartMode] = useState('weekly');

    const badgeEvolutionMonthly = useMemo(() =>
        MOCK_BADGE_EVOLUTION_MONTHLY_RAW.map(d => ({ name: t(`shared.months.${d.key}`), value: d.value })),
        [t]
    );
    const radarData = useMemo(() =>
        MOCK_RADAR_DATA_RAW.map(d => ({ level: t(`evolution.radarLevels.${d.key}`), value: d.value })),
        [t]
    );
    const pointsWeekly = useMemo(() =>
        MOCK_POINTS_WEEKLY_RAW.map(d => ({ name: t(`shared.days.${d.key}`), value: d.value })),
        [t]
    );
    const pointsMonthly = useMemo(() =>
        MOCK_POINTS_MONTHLY_RAW.map(d => ({ name: t(`shared.months.${d.key}`), value: d.value })),
        [t]
    );

    const greeting = `${getGreeting(t)}, ${displayName || authUser?.name || t('evolution.user')}!`;
    const badgeChartData = badgeChartMode === 'monthly' ? badgeEvolutionMonthly : MOCK_BADGE_EVOLUTION_ANNUAL;
    const pointsChartData = pointsChartMode === 'weekly' ? pointsWeekly : pointsMonthly;

    return (
        <div className={styles.page}>
            {/* Welcome Header */}
            <section className={styles.welcomeSection}>
                <h1 className={styles.greeting}>{greeting}</h1>
                <p className={styles.subtitle}>
                    <Trans
                        i18nKey="evolution.subtitle"
                        values={{ percentage: '78' }}
                        components={{ highlight: <span /> }}
                    />
                </p>
            </section>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                {MOCK_STATS.map((stat) => (
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
                    <p className={styles.radarSubtitle}>{t('evolution.technicalJourney')}</p>
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
                                    domain={[0, 10]}
                                    tick={false}
                                    axisLine={false}
                                />
                                <Radar
                                    dataKey="value"
                                    stroke="var(--color-primary)"
                                    fill="rgba(0, 184, 224, 0.2)"
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
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
                                <span className={`${styles.appStatValue} ${styles.valuePrimary}`}>2d 17h</span>
                            </div>
                        </div>
                        <div className={`${styles.appStatItem} ${styles.appStatSuccess}`}>
                            <div className={styles.appStatIcon}>
                                <Icon name="check_circle" size={20} color="var(--color-success)" />
                            </div>
                            <div className={styles.appStatContent}>
                                <span className={styles.appStatLabel}>{t('evolution.approvalRate')}</span>
                                <span className={`${styles.appStatValue} ${styles.valueSuccess}`}>70%</span>
                            </div>
                        </div>
                        <div className={`${styles.appStatItem} ${styles.appStatSecondary}`}>
                            <div className={styles.appStatIcon}>
                                <Icon name="paper" size={20} color="var(--color-secondary)" />
                            </div>
                            <div className={styles.appStatContent}>
                                <span className={styles.appStatLabel}>{t('evolution.applicationsMade')}</span>
                                <span className={`${styles.appStatValue} ${styles.valueSecondary}`}>18</span>
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
                        {MOCK_ACTIVITIES.map((activity, idx) => (
                            <div key={idx} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    <Icon name={activity.icon} size={18} color={activity.iconColor} />
                                </div>
                                <div className={styles.activityContent}>
                                    <span className={styles.activityTitle}>
                                        {t(`evolution.${activity.titleKey}`)}
                                    </span>
                                    <span className={styles.activityDesc}>
                                        {t(`evolution.${activity.descKey}`)}
                                    </span>
                                </div>
                                <span className={styles.activityTime}>
                                    {t(`evolution.${activity.timeKey}`)}
                                </span>
                            </div>
                        ))}
                    </div>
                </ContentCard>

                <ContentCard className={styles.achievementsCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.specialAchievements')}</h2>
                    <div className={styles.achievementsList}>
                        {MOCK_ACHIEVEMENTS.map((ach, idx) => (
                            <div
                                key={idx}
                                className={styles.achievementItem}
                                style={{ borderLeftColor: ach.color }}
                            >
                                <div className={styles.achievementIcon}>
                                    <Icon name="trophy" size={18} color={ach.color} />
                                </div>
                                <div className={styles.achievementContent}>
                                    <span className={styles.achievementTitle}>
                                        {t(`evolution.${ach.titleKey}`)}
                                    </span>
                                    <span className={styles.achievementDesc}>
                                        {t(`evolution.${ach.descKey}`)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ContentCard>

                <ContentCard className={styles.learningPathsCard}>
                    <h2 className={styles.cardTitle}>{t('evolution.learningPaths')}</h2>
                    <div className={styles.lpList}>
                        {MOCK_LEARNING_PATHS.map((lp, idx) => (
                            <div key={idx} className={styles.lpItem}>
                                <div className={styles.lpHeader}>
                                    <div className={styles.lpInfo}>
                                        <div
                                            className={styles.lpIcon}
                                            style={{ backgroundColor: lp.color }}
                                        />
                                        <div>
                                            <span className={styles.lpName}>
                                                {t(`evolution.${lp.nameKey}`)}
                                            </span>
                                            <span className={styles.lpBadges}>
                                                {lp.badgesText} &middot; {t(`evolution.${lp.stageKey}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={styles.lpPercentage} style={{ color: lp.color }}>
                                        {lp.percentage}%
                                    </span>
                                </div>
                                <div className={styles.lpProgressTrack}>
                                    <div
                                        className={styles.lpProgressFill}
                                        style={{ width: `${lp.percentage}%`, backgroundColor: lp.color }}
                                    />
                                </div>
                                <div className={styles.lpNext}>
                                    <Icon name="spark" size={14} color={lp.color} />
                                    <span>{t(`evolution.${lp.nextKey}`)}</span>
                                </div>
                            </div>
                        ))}
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
                {stat.delta && (
                    <span className={styles.statDelta}>{stat.delta}</span>
                )}
            </div>
            <span className={styles.statLabel}>{t(`evolution.stats.${stat.key}`)}</span>
            <span className={styles.statValue} style={{ color: valueColor }}>
                {stat.key === 'averageLevel'
                    ? <>{stat.value} <span className={styles.statLevelLabel}>({t('evolution.stats.senior')})</span></>
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
