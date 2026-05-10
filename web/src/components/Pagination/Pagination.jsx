import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const { t } = useTranslation();

    // Creates an array with the page numbers (e.g., if totalPages is 5, creates [1, 2, 3, 4, 5])
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // If there is only 1 page (or 0), there is no need to show pagination
    if (totalPages <= 1) return null;

    return (
        <nav aria-label={t('pagination.navigation')}>
            {/* Using Bootstrap base classes, but adding 'customPagination' for our custom styles */}
            <ul className={`pagination ${styles.customPagination} justify-content-center`}>

                {/* Previous Button */}
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                        className="page-link shadow-none"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        {t('pagination.previous')}
                    </button>
                </li>

                {/* Page Numbers */}
                {pages.map((page) => (
                    <li
                        key={page}
                        className={`page-item ${currentPage === page ? 'active' : ''}`}
                    >
                        <button
                            className="page-link shadow-none"
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    </li>
                ))}

                {/* Next Button */}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                        className="page-link shadow-none"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        {t('pagination.next')}
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;