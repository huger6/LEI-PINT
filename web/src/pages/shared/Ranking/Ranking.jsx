import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../../hooks/userContext';
import ContentCard from '../../../components/ContentCard/ContentCard';
import { CardHeader } from '../../../components/ContentCard/ContentCard';
import Avatar from '../../../components/Avatar/Avatar';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Button from '../../../components/Button/Button';
import Pagination from '../../../components/Pagination/Pagination';
import Icon from '../../../components/Icons/Icons';
import styles from './Ranking.module.css';

const MOCK_RANKING = [
    { position: 1, name: 'Ana Silva', area: 'Front-End', badges: 12, points: 2500 },
    { position: 2, name: 'Carlos Mendes', area: 'Machine Learning', badges: 10, points: 1850 },
    { position: 3, name: 'Sofia Costa', area: 'Back-End', badges: 9, points: 1620 },
    { position: 4, name: 'Miguel Santos', area: 'Front-End', badges: 8, points: 1241 },
    { position: 5, name: 'Beatriz Oliveira', area: 'Data Science', badges: 7, points: 1100 },
    { position: 6, name: 'João Ferreira', area: 'DevOps', badges: 7, points: 980 },
    { position: 7, name: 'Mariana Lima', area: 'Back-End', badges: 6, points: 870 },
    { position: 8, name: 'Tiago Rocha', area: 'Front-End', badges: 5, points: 750 },
    { position: 9, name: 'Inês Martins', area: 'Machine Learning', badges: 5, points: 680 },
    { position: 10, name: 'Ricardo Alves', area: 'DevOps', badges: 4, points: 520 },
];

const MOCK_AREAS = [
    { value: '', label: '' },
    { value: 'front-end', label: 'Front-End' },
    { value: 'back-end', label: 'Back-End' },
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'devops', label: 'DevOps' },
];

const PAGE_SIZE = 10;

const PODIUM_COLORS = {
    1: { bg: 'var(--color-green-soft)', border: 'var(--color-warning)', badge: 'var(--color-warning)' },
    2: { bg: 'var(--color-blue-soft)', border: '#adb5bd', badge: '#adb5bd' },
    3: { bg: 'var(--color-orange-soft)', border: 'var(--color-orange-on-soft)', badge: '#cd7f32' },
};

function getSubtitle(role, t) {
    switch (role) {
        case 'Service Line Leader':
            return t('ranking.subtitleSll');
        case 'Talent Manager':
        case 'Administrator':
            return t('ranking.subtitleGeneral');
        default:
            return t('ranking.subtitleArea');
    }
}

function PodiumCard({ entry, rank }) {
    const colors = PODIUM_COLORS[rank];
    const isFirst = rank === 1;
    const avatarSize = isFirst ? 96 : 80;

    return (
        <div className={styles.podiumCard}>
            {isFirst && (
                <div className={styles.crownIcon}>
                    <Icon name="trophy" size={24} color="var(--color-warning)" />
                </div>
            )}
            <div className={styles.podiumAvatarWrapper}>
                <div
                    className={styles.podiumAvatarRing}
                    style={{
                        width: avatarSize + 8,
                        height: avatarSize + 8,
                        borderColor: colors.border,
                    }}
                >
                    <Avatar name={entry.name} size={avatarSize} />
                </div>
                <span
                    className={styles.podiumRankBadge}
                    style={{ background: colors.badge }}
                >
                    {rank}
                </span>
            </div>
            <span className={styles.podiumName}>{entry.name}</span>
            <span className={styles.podiumBadges}>
                {entry.badges} badges
            </span>
            <span className={styles.podiumPoints}>{entry.points} pts</span>
        </div>
    );
}

function PositionBadge({ position }) {
    const isTop3 = position <= 3;
    const colorMap = { 1: 'var(--color-warning)', 2: '#adb5bd', 3: '#cd7f32' };

    return (
        <span
            className={styles.positionBadge}
            style={isTop3 ? { background: colorMap[position], color: '#fff' } : undefined}
        >
            #{position}
        </span>
    );
}

export default function Ranking() {
    const { t } = useTranslation();
    const { user } = useUser();
    const [selectedArea, setSelectedArea] = useState('');
    const [appliedArea, setAppliedArea] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const showAreaFilter = user?.role !== 'Consultant';

    const filteredRanking = useMemo(() => {
        if (!appliedArea) return MOCK_RANKING;
        return MOCK_RANKING.filter(
            (e) => e.area.toLowerCase().replace(/\s+/g, '-') === appliedArea
        );
    }, [appliedArea]);

    const top3 = filteredRanking.slice(0, 3);

    const totalPages = Math.ceil(filteredRanking.length / PAGE_SIZE);
    const paginatedData = filteredRanking.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleFilter = () => {
        setAppliedArea(selectedArea);
        setCurrentPage(1);
    };

    const subtitle = getSubtitle(user?.role, t);

    return (
        <div className={styles.page}>
            <div className="container-fluid px-0">
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('ranking.title')}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                {showAreaFilter && (
                    <div className={styles.filterBar}>
                        <div className={styles.filterSelect}>
                            <CustomSelect
                                id="ranking-area-filter"
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                options={MOCK_AREAS}
                                placeholder={t('ranking.areaPlaceholder')}
                            />
                        </div>
                        <Button onClick={handleFilter} size="md">
                            <Icon name="filter" size={18} color="var(--color-on-primary)" />
                            {t('ranking.filter')}
                        </Button>
                    </div>
                )}

                {top3.length > 0 && (
                    <ContentCard className={styles.podiumSection}>
                        <CardHeader
                            icon="trophy"
                            iconBg="var(--color-orange-soft)"
                            iconColor="var(--color-warning)"
                            title={t('ranking.top3Title')}
                        />
                        <div className={styles.podiumContainer}>
                            {top3[1] && <PodiumCard entry={top3[1]} rank={2} />}
                            {top3[0] && <PodiumCard entry={top3[0]} rank={1} />}
                            {top3[2] && <PodiumCard entry={top3[2]} rank={3} />}
                        </div>
                    </ContentCard>
                )}

                <ContentCard className={styles.tableSection}>
                    <CardHeader
                        icon="progress"
                        iconBg="var(--color-blue-soft)"
                        iconColor="var(--color-blue-on-soft)"
                        title={t('ranking.fullRankingTitle')}
                    />
                    <div className={styles.tableWrapper}>
                        <table className={styles.rankingTable}>
                            <thead>
                                <tr>
                                    <th>{t('ranking.position')}</th>
                                    <th>{t('ranking.consultant')}</th>
                                    <th>{t('ranking.area')}</th>
                                    <th>{t('ranking.badgesObtained')}</th>
                                    <th>{t('ranking.points')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((entry) => (
                                    <tr key={entry.position}>
                                        <td>
                                            <PositionBadge position={entry.position} />
                                        </td>
                                        <td>
                                            <div className={styles.consultantCell}>
                                                <Avatar name={entry.name} size={36} />
                                                <span>{entry.name}</span>
                                            </div>
                                        </td>
                                        <td>{entry.area}</td>
                                        <td>{entry.badges}</td>
                                        <td className={styles.pointsCell}>
                                            {entry.points}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.emptyRow}>
                                            {t('ranking.noResults')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredRanking.length}
                        itemCount={paginatedData.length}
                        onPageChange={setCurrentPage}
                    />
                </ContentCard>
            </div>
        </div>
    );
}
