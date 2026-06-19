import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../../hooks/userContext';
import ContentCard from '../../../components/ContentCard/ContentCard';
import { CardHeader } from '../../../components/ContentCard/ContentCard';
import Avatar from '../../../components/Avatar/Avatar';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Button from '../../../components/Button/Button';
import Pagination from '../../../components/Pagination/Pagination';
import Icon from '../../../components/Icons/Icons';
import Skeleton from '../../../components/Skeleton/Skeleton';
import { getRanking, getMyRankingPosition } from '../../../services/pointsService';
import { getServiceLines, getAreas } from '../../../services/hierarchyService';
import styles from './Ranking.module.css';

const PAGE_SIZE = 30;

const PODIUM_COLORS = {
    1: { border: 'var(--color-warning)', badge: 'var(--color-warning)' },
    2: { border: '#adb5bd', badge: '#adb5bd' },
    3: { border: 'var(--color-orange-on-soft)', badge: '#cd7f32' },
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

function PodiumCard({ entry, rank, page }) {
    const colors = PODIUM_COLORS[rank];
    const isFirst = rank === 1;
    const avatarSize = isFirst ? 96 : 80;
    const position = (page - 1) * PAGE_SIZE + rank;

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
                    <Avatar
                        src={entry.profile_img_url}
                        name={entry.full_name}
                        size={avatarSize}
                    />
                </div>
                <span
                    className={styles.podiumRankBadge}
                    style={{ background: colors.badge }}
                >
                    {position}
                </span>
            </div>
            <span className={styles.podiumName}>{entry.full_name}</span>
            <span className={styles.podiumBadges}>
                {entry.total_badges} badges
            </span>
            <span className={styles.podiumPoints}>{Number(entry.total_points).toLocaleString('pt-PT')} pts</span>
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

function ConsultantScopeFilter({ user, serviceLines, areas, appliedScope, onScopeChange, t }) {
    const userPrimaryArea = user?.areas?.find((a) => a.isPrimary);
    const userSl = user?.serviceLine;

    const scopeOptions = useMemo(() => {
        const opts = [];
        if (userPrimaryArea) {
            const matchedArea = areas.find((a) => a.area_slug === userPrimaryArea.slug);
            if (matchedArea) {
                opts.push({ value: `area:${matchedArea.area_id}`, label: t('ranking.scopeMyArea') });
            }
        }
        if (userSl) {
            const matchedSl = serviceLines.find((sl) => sl.sl_slug === userSl.slug);
            if (matchedSl) {
                opts.push({ value: `sl:${matchedSl.service_line_id}`, label: t('ranking.scopeMyServiceLine') });
            }
        }
        opts.push({ value: 'general', label: t('ranking.scopeGeneral') });
        return opts;
    }, [userPrimaryArea, userSl, serviceLines, areas, t]);

    return (
        <div className={styles.filterBar}>
            <div className={styles.scopeButtons}>
                {scopeOptions.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`${styles.scopeBtn} ${appliedScope === opt.value ? styles.scopeBtnActive : ''}`}
                        onClick={() => onScopeChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ManagementFilter({
    role, serviceLines, areas, selectedSl, selectedArea, onSlChange, onAreaChange, onFilter, t
}) {
    const showSlFilter = role === 'Talent Manager' || role === 'Administrator';

    const filteredAreas = useMemo(() => {
        if (!selectedSl) return areas;
        return areas.filter((a) => String(a.service_line_id) === String(selectedSl));
    }, [areas, selectedSl]);

    const areaOptions = useMemo(() => [
        { value: '', label: t('ranking.allAreas') },
        ...filteredAreas.map((a) => ({ value: String(a.area_id), label: a.area_name })),
    ], [filteredAreas, t]);

    const slOptions = useMemo(() => [
        { value: '', label: t('ranking.allServiceLines') },
        ...serviceLines.map((sl) => ({ value: String(sl.service_line_id), label: sl.service_line_name })),
    ], [serviceLines, t]);

    return (
        <div className={styles.filterBar}>
            {showSlFilter && (
                <div className={styles.filterSelect}>
                    <CustomSelect
                        id="ranking-sl-filter"
                        value={selectedSl}
                        onChange={(e) => {
                            onSlChange(e.target.value);
                            onAreaChange('');
                        }}
                        options={slOptions}
                        placeholder={t('ranking.serviceLinePlaceholder')}
                    />
                </div>
            )}
            <div className={styles.filterSelect}>
                <CustomSelect
                    id="ranking-area-filter"
                    value={selectedArea}
                    onChange={(e) => onAreaChange(e.target.value)}
                    options={areaOptions}
                    placeholder={t('ranking.areaPlaceholder')}
                />
            </div>
            <Button onClick={onFilter} size="md">
                <Icon name="filter" size={18} color="var(--color-on-primary)" />
                {t('ranking.filter')}
            </Button>
        </div>
    );
}

export default function Ranking() {
    const { t } = useTranslation();
    const { user } = useUser();
    const role = user?.role;

    const [rankings, setRankings] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [serviceLines, setServiceLines] = useState([]);
    const [areas, setAreas] = useState([]);
    const [hierarchyLoaded, setHierarchyLoaded] = useState(false);

    const [selectedSl, setSelectedSl] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [appliedSl, setAppliedSl] = useState('');
    const [appliedArea, setAppliedArea] = useState('');

    const [consultantScope, setConsultantScope] = useState('initial');
    // SLL ranking scope: 'sl' (own Service Line, default) | 'area:<id>' | 'general' (all)
    const [sllScope, setSllScope] = useState('sl');
    const [findingPosition, setFindingPosition] = useState(false);
    const [scrollToMe, setScrollToMe] = useState(false);
    const myRowRef = useRef(null);
    const skipNextFetchRef = useRef(false);

    useEffect(() => {
        Promise.all([getServiceLines(), getAreas()])
            .then(([slData, areaData]) => {
                setServiceLines(slData);
                setAreas(areaData);
                setHierarchyLoaded(true);
            })
            .catch(() => setHierarchyLoaded(true));
    }, []);

    const resolveInitialConsultantScope = useCallback(() => {
        if (role !== 'Consultant' || !hierarchyLoaded) return null;

        const primaryArea = user?.areas?.find((a) => a.isPrimary);
        if (primaryArea) {
            const matched = areas.find((a) => a.area_slug === primaryArea.slug);
            if (matched) return `area:${matched.area_id}`;
        }

        const userSl = user?.serviceLine;
        if (userSl) {
            const matched = serviceLines.find((sl) => sl.sl_slug === userSl.slug);
            if (matched) return `sl:${matched.service_line_id}`;
        }

        return 'general';
    }, [role, user, hierarchyLoaded, areas, serviceLines]);

    useEffect(() => {
        if (role === 'Consultant' && hierarchyLoaded && consultantScope === 'initial') {
            const resolved = resolveInitialConsultantScope();
            if (resolved) setConsultantScope(resolved);
        }
    }, [role, hierarchyLoaded, consultantScope, resolveInitialConsultantScope]);

    const resolveSlFilterForSll = useCallback(() => {
        if (role !== 'Service Line Leader' || !hierarchyLoaded) return null;
        const userSl = user?.serviceLine;
        if (!userSl) return null;
        const matched = serviceLines.find((sl) => sl.sl_slug === userSl.slug);
        return matched ? String(matched.service_line_id) : null;
    }, [role, user, hierarchyLoaded, serviceLines]);

    const buildApiParams = useCallback(() => {
        const params = { page: currentPage, limit: PAGE_SIZE };

        if (role === 'Consultant') {
            if (consultantScope.startsWith('area:')) {
                params.areaId = consultantScope.split(':')[1];
            } else if (consultantScope.startsWith('sl:')) {
                params.serviceLineId = consultantScope.split(':')[1];
            }
        } else if (role === 'Service Line Leader') {
            if (sllScope.startsWith('area:')) {
                params.areaId = sllScope.split(':')[1];
            } else if (sllScope === 'sl') {
                const sllSlId = resolveSlFilterForSll();
                if (sllSlId) params.serviceLineId = sllSlId;
            }
            // 'general' → no scope (todos)
        } else {
            if (appliedSl) params.serviceLineId = appliedSl;
            if (appliedArea) params.areaId = appliedArea;
        }

        return params;
    }, [currentPage, role, consultantScope, sllScope, appliedSl, appliedArea, resolveSlFilterForSll]);

    useEffect(() => {
        if (!hierarchyLoaded) return;
        if (role === 'Consultant' && consultantScope === 'initial') return;
        if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
            return;
        }

        setLoading(true);
        getRanking(buildApiParams())
            .then(({ rankings: data, pagination: pag }) => {
                setRankings(data);
                setPagination(pag);
            })
            .catch(() => {
                setRankings([]);
                setPagination(null);
            })
            .finally(() => setLoading(false));
    }, [hierarchyLoaded, consultantScope, buildApiParams, role]);

    const handleFilter = () => {
        setAppliedSl(selectedSl);
        setAppliedArea(selectedArea);
        setCurrentPage(1);
    };

    const handleConsultantScopeChange = (scope) => {
        setConsultantScope(scope);
        setCurrentPage(1);
    };

    const handleSllScopeChange = (scope) => {
        setSllScope(scope);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleFindMyPosition = async () => {
        if (findingPosition) return;
        setFindingPosition(true);
        try {
            const params = { limit: PAGE_SIZE };

            if (role === 'Consultant') {
                if (consultantScope.startsWith('area:')) {
                    params.areaId = consultantScope.split(':')[1];
                } else if (consultantScope.startsWith('sl:')) {
                    params.serviceLineId = consultantScope.split(':')[1];
                }
            } else if (role === 'Service Line Leader') {
                if (sllScope.startsWith('area:')) {
                    params.areaId = sllScope.split(':')[1];
                } else if (sllScope === 'sl') {
                    const sllSlId = resolveSlFilterForSll();
                    if (sllSlId) params.serviceLineId = sllSlId;
                }
            } else {
                if (appliedSl) params.serviceLineId = appliedSl;
                if (appliedArea) params.areaId = appliedArea;
            }

            const result = await getMyRankingPosition(params);
            if (result?.page) {
                const { rankings: data, pagination: pag } = await getRanking({
                    ...params, page: result.page
                });
                skipNextFetchRef.current = true;
                setRankings(data);
                setPagination(pag);
                setCurrentPage(result.page);
                setScrollToMe(true);
            }
        } catch {
            // User not found in current ranking scope
        } finally {
            setFindingPosition(false);
        }
    };

    useEffect(() => {
        if (scrollToMe && !loading && myRowRef.current) {
            myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setScrollToMe(false);
        }
    }, [scrollToMe, loading]);

    const top3 = currentPage === 1 ? rankings.slice(0, 3) : [];
    const totalPages = pagination?.totalPages || 1;
    const totalItems = pagination?.totalItems || 0;

    const subtitle = getSubtitle(role, t);

    const sllFilteredAreas = useMemo(() => {
        if (role !== 'Service Line Leader') return [];
        const sllSlId = resolveSlFilterForSll();
        if (!sllSlId) return areas;
        return areas.filter((a) => String(a.service_line_id) === String(sllSlId));
    }, [role, areas, resolveSlFilterForSll]);

    return (
        <div className={styles.page}>
            <div className="container-fluid px-0">
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('ranking.title')}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                {role === 'Consultant' && hierarchyLoaded && (
                    <ConsultantScopeFilter
                        user={user}
                        serviceLines={serviceLines}
                        areas={areas}
                        appliedScope={consultantScope}
                        onScopeChange={handleConsultantScopeChange}
                        t={t}
                    />
                )}

                {role === 'Service Line Leader' && hierarchyLoaded && (
                    <div className={styles.filterBar}>
                        <div className={styles.scopeButtons}>
                            <button
                                type="button"
                                className={`${styles.scopeBtn} ${sllScope === 'sl' ? styles.scopeBtnActive : ''}`}
                                onClick={() => handleSllScopeChange('sl')}
                            >
                                {t('ranking.scopeMyServiceLine')}
                            </button>
                            {sllFilteredAreas.map((a) => (
                                <button
                                    key={a.area_id}
                                    type="button"
                                    className={`${styles.scopeBtn} ${sllScope === `area:${a.area_id}` ? styles.scopeBtnActive : ''}`}
                                    onClick={() => handleSllScopeChange(`area:${a.area_id}`)}
                                >
                                    {a.area_name}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`${styles.scopeBtn} ${sllScope === 'general' ? styles.scopeBtnActive : ''}`}
                                onClick={() => handleSllScopeChange('general')}
                            >
                                {t('ranking.scopeGeneral')}
                            </button>
                        </div>
                    </div>
                )}

                {(role === 'Talent Manager' || role === 'Administrator') && hierarchyLoaded && (
                    <ManagementFilter
                        role={role}
                        serviceLines={serviceLines}
                        areas={areas}
                        selectedSl={selectedSl}
                        selectedArea={selectedArea}
                        onSlChange={setSelectedSl}
                        onAreaChange={setSelectedArea}
                        onFilter={handleFilter}
                        t={t}
                    />
                )}

                {loading ? (
                    <ContentCard className={styles.podiumSection}>
                        <Skeleton height={300} borderRadius={16} />
                    </ContentCard>
                ) : (
                    <>
                        {top3.length > 0 && (
                            <ContentCard className={styles.podiumSection}>
                                <CardHeader
                                    icon="trophy"
                                    iconBg="var(--color-orange-soft)"
                                    iconColor="var(--color-warning)"
                                    title={t('ranking.top3Title')}
                                />
                                <div className={styles.podiumContainer}>
                                    {top3[1] && <PodiumCard entry={top3[1]} rank={2} page={currentPage} />}
                                    {top3[0] && <PodiumCard entry={top3[0]} rank={1} page={currentPage} />}
                                    {top3[2] && <PodiumCard entry={top3[2]} rank={3} page={currentPage} />}
                                </div>
                            </ContentCard>
                        )}

                        <ContentCard className={styles.tableSection}>
                            <div className={styles.tableHeader}>
                                <CardHeader
                                    icon="progress"
                                    iconBg="var(--color-blue-soft)"
                                    iconColor="var(--color-blue-on-soft)"
                                    title={t('ranking.fullRankingTitle')}
                                />
                                {role === 'Consultant' && (
                                    <Button
                                        onClick={handleFindMyPosition}
                                        size="sm"
                                        variant="outline"
                                        disabled={findingPosition}
                                    >
                                        <Icon name="target" size={16} />
                                        {t('ranking.myPosition')}
                                    </Button>
                                )}
                            </div>
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
                                        {rankings.map((entry, idx) => {
                                            const position = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                            const isMe = user?.guid && entry.user_guid === user.guid;
                                            return (
                                                <tr
                                                    key={entry.user_guid}
                                                    ref={isMe ? myRowRef : undefined}
                                                    className={isMe ? styles.highlightedRow : undefined}
                                                >
                                                    <td>
                                                        <PositionBadge position={position} />
                                                    </td>
                                                    <td>
                                                        <div className={styles.consultantCell}>
                                                            <Avatar
                                                                src={entry.profile_img_url}
                                                                name={entry.full_name}
                                                                size={36}
                                                            />
                                                            <span>{entry.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{entry.primary_area_name || '—'}</td>
                                                    <td>{entry.total_badges}</td>
                                                    <td className={styles.pointsCell}>
                                                        {Number(entry.total_points).toLocaleString('pt-PT')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {rankings.length === 0 && (
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
                                totalItems={totalItems}
                                itemCount={rankings.length}
                                onPageChange={handlePageChange}
                            />
                        </ContentCard>
                    </>
                )}
            </div>
        </div>
    );
}
