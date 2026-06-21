import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { globalSearch } from '../../../services/searchService';
import { SHARED } from '../../../routes/paths';
import Icon from '../../../components/Icons/Icons';
import Spinner from '../../../components/Spinner/Spinner';
import styles from './SearchResults.module.css';

const SECTION_CONFIG = {
    learning_path: { icon: 'learning-path', labelKey: 'search.learningPaths' },
    service_line: { icon: 'service-line', labelKey: 'search.serviceLines' },
    area: { icon: 'area', labelKey: 'search.areas' },
    badge: { icon: 'badge', labelKey: 'search.badges' },
    skill: { icon: 'skills', labelKey: 'search.skills' },
    user: { icon: 'user', labelKey: 'search.users' },
};

const SECTION_ORDER = ['learning_path', 'service_line', 'area', 'badge', 'skill', 'user'];

function buildBreadcrumb(item) {
    const parts = [];
    if (item.parent_learning_path) parts.push(item.parent_learning_path.path_title);
    if (item.parent_service_line) parts.push(item.parent_service_line.service_line_name);
    if (item.parent_area) parts.push(item.parent_area.area_name);
    if (item.parent_stage) parts.push(item.parent_stage.stage_title);
    if (item.parent_badge) parts.push(item.parent_badge.badge_title);
    return parts.join(' > ');
}

function getResultLink(item) {
    // `subtitle` carries the slug for badge / structure entities.
    switch (item.entity_type) {
        case 'badge':
            return item.subtitle ? SHARED.BADGE_DETAIL.replace(':slug', item.subtitle) : null;
        case 'learning_path':
            return item.subtitle ? SHARED.STRUCTURE_LP_DETAIL.replace(':slug', item.subtitle) : null;
        case 'service_line':
            return item.subtitle ? SHARED.STRUCTURE_SL_DETAIL.replace(':slug', item.subtitle) : null;
        case 'area':
            return item.subtitle ? SHARED.STRUCTURE_AREA_DETAIL.replace(':slug', item.subtitle) : null;
        case 'skill':
        case 'user':
        default:
            return null;
    }
}

function ResultRow({ item }) {
    const breadcrumb = item.entity_type === 'badge' ? null : buildBreadcrumb(item);
    const link = getResultLink(item);

    const content = (
        <>
            {item.image_url ? (
                <img src={item.image_url} alt="" className={styles.resultImage} />
            ) : (
                <span className={styles.resultImagePlaceholder}>
                    <Icon
                        name={SECTION_CONFIG[item.entity_type]?.icon || 'search'}
                        size={18}
                    />
                </span>
            )}
            <div className={styles.resultContent}>
                <span className={styles.resultTitle}>{item.title}</span>
                {breadcrumb && <span className={styles.resultBreadcrumb}>{breadcrumb}</span>}
            </div>
            {item.entity_type === 'badge' && item.meta && (
                <span className={styles.resultMeta}>{item.meta}</span>
            )}
            {item.entity_type === 'user' && item.meta && (
                <span className={styles.resultMeta}>{item.meta}</span>
            )}
        </>
    );

    if (link) {
        return <Link to={link} className={styles.resultItem}>{content}</Link>;
    }

    return <div className={styles.resultItem}>{content}</div>;
}

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { t } = useTranslation();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setTotalItems(0);
            setError(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(false);

        globalSearch(query).then((res) => {
            if (cancelled) return;
            setResults(res.data || []);
            setTotalItems(res.pagination?.totalItems || 0);
        }).catch(() => {
            if (cancelled) return;
            setResults([]);
            setTotalItems(0);
            setError(true);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    }, [query]);

    const grouped = SECTION_ORDER.reduce((acc, type) => {
        const items = results.filter((r) => r.entity_type === type);
        if (items.length > 0) acc.push({ type, items });
        return acc;
    }, []);

    if (!query.trim()) {
        return (
            <div className={`container ${styles.page}`}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Icon name="search" size={48} />
                    </div>
                    <h2 className={styles.emptyTitle}>{t('search.enterQuery')}</h2>
                    <p className={styles.emptyText}>{t('search.enterQueryDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('search.resultsFor', { query })}</h1>
                {!loading && (
                    <p className={styles.subtitle}>
                        {t('search.resultCount', { count: totalItems })}
                    </p>
                )}
            </div>

            {loading && <Spinner />}

            {!loading && error && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Icon name="danger" size={48} />
                    </div>
                    <h2 className={styles.emptyTitle}>{t('search.error')}</h2>
                    <p className={styles.emptyText}>{t('search.errorDesc')}</p>
                </div>
            )}

            {!loading && !error && grouped.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Icon name="search" size={48} />
                    </div>
                    <h2 className={styles.emptyTitle}>{t('search.noResults')}</h2>
                    <p className={styles.emptyText}>{t('search.noResultsDesc')}</p>
                </div>
            )}

            {!loading && !error && grouped.map(({ type, items }) => {
                const config = SECTION_CONFIG[type];
                return (
                    <section key={type} className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Icon
                                name={config.icon}
                                size={18}
                                className={styles.sectionIcon}
                            />
                            <h2 className={styles.sectionTitle}>{t(config.labelKey)}</h2>
                            <span className={styles.sectionCount}>{items.length}</span>
                        </div>
                        <ul className={styles.resultsList}>
                            {items.map((item, idx) => (
                                <li key={`${item.entity_type}-${item.entity_id}`}>
                                    <ResultRow item={item} />
                                    {idx < items.length - 1 && <div className={styles.separator} />}
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
