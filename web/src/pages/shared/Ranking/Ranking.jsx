import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
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

// Number of ranking rows per page.
const PAGE_SIZE = 30;

// Border/badge colors for the top-3 podium positions.
const PODIUM_COLORS = {
    1: { border: 'var(--color-warning)', badge: 'var(--color-warning)' },
    2: { border: '#adb5bd', badge: '#adb5bd' },
    3: { border: 'var(--color-orange-on-soft)', badge: '#cd7f32' },
};

// Pick the page subtitle text based on the viewer's role.
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

// Podium card for one of the top-3 ranked consultants.
function PodiumCard({ entry, rank, page }) {
    // Colors for this podium rank.
    const colors = PODIUM_COLORS[rank];
    // Whether this is the first-place card (larger, with crown).
    const isFirst = rank === 1;
    // Avatar size depends on whether it's first place.
    const avatarSize = isFirst ? 96 : 80;
    // Absolute ranking position accounting for the current page.
    const position = (page - 1) * PAGE_SIZE + rank;

    // Link to the user's profile when a guid exists, otherwise a plain div.
    const Wrapper = entry.user_guid ? Link : 'div';
    // Props for the wrapper element (link target + classes).
    const wrapperProps = entry.user_guid
        ? { to: `/u/${entry.user_guid}`, className: `${styles.podiumCard} ${styles.consultantLink}` }
        : { className: styles.podiumCard };

    return (
        <Wrapper {...wrapperProps}>
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
        </Wrapper>
    );
}

// Small "#N" badge shown in the ranking table, highlighted for the top 3.
function PositionBadge({ position }) {
    // Whether this position is within the top 3.
    const isTop3 = position <= 3;
    // Background color per top-3 position.
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

// Scope buttons (my area / my service line / general) shown to consultants.
function ConsultantScopeFilter({ user, serviceLines, areas, appliedScope, onScopeChange, t }) {
    // The consultant's primary area, if any.
    const userPrimaryArea = user?.areas?.find((a) => a.isPrimary);
    // The consultant's service line, if any.
    const userSl = user?.serviceLine;

    // Build the available scope options based on the user's area/service line.
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

// Service-line/area dropdown filters for Talent Managers and Administrators.
function ManagementFilter({
    role, serviceLines, areas, selectedSl, selectedArea, onSlChange, onAreaChange, onFilter, t
}) {
    // Only TM/Admin can filter by service line.
    const showSlFilter = role === 'Talent Manager' || role === 'Administrator';

    // Restrict areas to the selected service line (or all if none selected).
    const filteredAreas = useMemo(() => {
        if (!selectedSl) return areas;
        return areas.filter((a) => String(a.service_line_id) === String(selectedSl));
    }, [areas, selectedSl]);

    // Build area select options with an "all areas" entry.
    const areaOptions = useMemo(() => [
        { value: '', label: t('ranking.allAreas') },
        ...filteredAreas.map((a) => ({ value: String(a.area_id), label: a.area_name })),
    ], [filteredAreas, t]);

    // Build service-line select options with an "all service lines" entry.
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

// Ranking page: role-aware leaderboard with podium, table and scope filters.
export default function Ranking() {
    // Translation helper for localized labels.
    const { t } = useTranslation();
    // Current logged-in user.
    const { user } = useUser();
    // The viewer's role, which drives available filters and scope.
    const role = user?.role;

    // Ranking rows for the current page.
    const [rankings, setRankings] = useState([]);
    // Pagination metadata returned by the API.
    const [pagination, setPagination] = useState(null);
    // Currently displayed page number.
    const [currentPage, setCurrentPage] = useState(1);
    // Whether the ranking is loading.
    const [loading, setLoading] = useState(true);

    // Service lines for management filters.
    const [serviceLines, setServiceLines] = useState([]);
    // Areas for management/scope filters.
    const [areas, setAreas] = useState([]);
    // Whether the hierarchy (service lines + areas) has finished loading.
    const [hierarchyLoaded, setHierarchyLoaded] = useState(false);

    // Service line selected in the management filter (not yet applied).
    const [selectedSl, setSelectedSl] = useState('');
    // Area selected in the management filter (not yet applied).
    const [selectedArea, setSelectedArea] = useState('');
    // Applied service line filter used in API calls.
    const [appliedSl, setAppliedSl] = useState('');
    // Applied area filter used in API calls.
    const [appliedArea, setAppliedArea] = useState('');

    // Consultant ranking scope ('initial' until resolved, then area/sl/general).
    const [consultantScope, setConsultantScope] = useState('initial');
    // SLL ranking scope: 'sl' (own Service Line, default) | 'area:<id>' | 'general' (all)
    const [sllScope, setSllScope] = useState('sl');
    // Whether the "find my position" lookup is running.
    const [findingPosition, setFindingPosition] = useState(false);
    // Flag to scroll to the current user's row once loaded.
    const [scrollToMe, setScrollToMe] = useState(false);
    // Ref to the current user's table row for scroll-into-view.
    const myRowRef = useRef(null);
    // Skips the next data fetch (set when find-my-position already loaded data).
    const skipNextFetchRef = useRef(false);

    // Load service lines and areas once on mount.
    useEffect(() => {
        Promise.all([getServiceLines(), getAreas()])
            .then(([slData, areaData]) => {
                setServiceLines(slData);
                setAreas(areaData);
                setHierarchyLoaded(true);
            })
            .catch(() => setHierarchyLoaded(true));
    }, []);

    // Resolve a consultant's default ranking scope (general, see note below).
    const resolveInitialConsultantScope = useCallback(() => {
        if (role !== 'Consultant' || !hierarchyLoaded) return null;

        // Default to the general ranking so the consultant always sees their real
        // totals: a consultant can earn badges/points outside their primary area,
        // and an area-scoped default would show a misleading 0 pts / 0 badges.
        // "My area" / "My Service Line" remain available as explicit scopes.
        return 'general';
    }, [role, hierarchyLoaded]);

    // Set the consultant's initial scope once the hierarchy is available.
    useEffect(() => {
        if (role === 'Consultant' && hierarchyLoaded && consultantScope === 'initial') {
            const resolved = resolveInitialConsultantScope();
            if (resolved) setConsultantScope(resolved);
        }
    }, [role, hierarchyLoaded, consultantScope, resolveInitialConsultantScope]);

    // Resolve the service-line id matching an SLL's own service line.
    const resolveSlFilterForSll = useCallback(() => {
        if (role !== 'Service Line Leader' || !hierarchyLoaded) return null;
        const userSl = user?.serviceLine;
        if (!userSl) return null;
        const matched = serviceLines.find((sl) => sl.sl_slug === userSl.slug);
        return matched ? String(matched.service_line_id) : null;
    }, [role, user, hierarchyLoaded, serviceLines]);

    // Build the ranking API query params from the role and active scope/filters.
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

    // Fetch the ranking whenever the scope, filters or page change.
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

    // Apply the management filter selections and reset to the first page.
    const handleFilter = () => {
        setAppliedSl(selectedSl);
        setAppliedArea(selectedArea);
        setCurrentPage(1);
    };

    // Change the consultant scope and reset to the first page.
    const handleConsultantScopeChange = (scope) => {
        setConsultantScope(scope);
        setCurrentPage(1);
    };

    // Change the SLL scope and reset to the first page.
    const handleSllScopeChange = (scope) => {
        setSllScope(scope);
        setCurrentPage(1);
    };

    // Change the current page.
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Look up the current user's ranking page, load it and scroll to their row.
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

    // Scroll the current user's row into view once data has loaded.
    useEffect(() => {
        if (scrollToMe && !loading && myRowRef.current) {
            myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setScrollToMe(false);
        }
    }, [scrollToMe, loading]);

    // Top-3 entries, shown as a podium only on the first page.
    const top3 = currentPage === 1 ? rankings.slice(0, 3) : [];
    // Total number of pages from pagination metadata.
    const totalPages = pagination?.totalPages || 1;
    // Total number of ranked items from pagination metadata.
    const totalItems = pagination?.totalItems || 0;

    // Role-specific page subtitle.
    const subtitle = getSubtitle(role, t);

    // Areas restricted to an SLL's own service line, for their scope buttons.
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
                                                        {entry.user_guid ? (
                                                            <Link to={`/u/${entry.user_guid}`} className={styles.consultantLink}>
                                                                <div className={styles.consultantCell}>
                                                                    <Avatar src={entry.profile_img_url} name={entry.full_name} size={36} />
                                                                    <span>{entry.full_name}</span>
                                                                </div>
                                                            </Link>
                                                        ) : (
                                                            <div className={styles.consultantCell}>
                                                                <Avatar src={entry.profile_img_url} name={entry.full_name} size={36} />
                                                                <span>{entry.full_name}</span>
                                                            </div>
                                                        )}
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
