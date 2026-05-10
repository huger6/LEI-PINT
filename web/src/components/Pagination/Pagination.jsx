import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
    const { t } = useTranslation();
    const [maxVisible, setMaxVisible] = useState(8);

    useEffect(() => {
        const updateMaxVisible = () => {
            const width = window.innerWidth;
            if (width < 576) setMaxVisible(3);
            else if (width < 768) setMaxVisible(5);
            else setMaxVisible(8);
        };
        updateMaxVisible();
        window.addEventListener('resize', updateMaxVisible);
        return () => window.removeEventListener('resize', updateMaxVisible);
    }, []);

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = [];
        const sideCount = Math.floor((maxVisible - 3) / 2);
        let start = Math.max(2, currentPage - sideCount);
        let end = Math.min(totalPages - 1, currentPage + sideCount);

        if (currentPage - sideCount <= 2) {
            end = Math.min(totalPages - 1, maxVisible - 2);
        }
        if (currentPage + sideCount >= totalPages - 1) {
            start = Math.max(2, totalPages - maxVisible + 3);
        }

        pages.push(1);

        if (start > 2) {
            pages.push('start-ellipsis');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push('end-ellipsis');
        }

        pages.push(totalPages);

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <nav className={styles.wrapper} aria-label={t('pagination.navigation')}>
            <span className={styles.showingText}>
                {t('pagination.showing', { current: currentPage, total: totalPages, items: totalItems ?? '-' })}
            </span>

            <div className={styles.controls}>
                <button
                    className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    aria-label={t('pagination.first')}
                >
                    «
                </button>

                <button
                    className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label={t('pagination.previous')}
                >
                    ‹
                </button>

                {pageNumbers.map((page) => {
                    if (page === 'start-ellipsis' || page === 'end-ellipsis') {
                        return (
                            <span key={page} className={styles.ellipsis}>…</span>
                        );
                    }
                    return (
                        <button
                            key={page}
                            className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label={t('pagination.next')}
                >
                    ›
                </button>

                <button
                    className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label={t('pagination.last')}
                >
                    »
                </button>
            </div>
        </nav>
    );
};

export default Pagination;
