import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';
import Icon from '../../Icons/Icons';

export default function SearchBar({
    id = 'topbar-search',
    value,
    defaultValue = '',
    placeholder = 'Search...',
    ariaLabel = 'Search',
    className = '',
    onChange,
    onSearch
}) {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [isIconOnly, setIsIconOnly] = useState(() => window.matchMedia('(max-width: 991px)').matches);
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef(null);
    const overlayRef = useRef(null);

    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991px)');
        const handler = (e) => {
            setIsIconOnly(e.matches);
            if (!e.matches) setIsExpanded(false);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        if (isExpanded && inputRef.current) inputRef.current.focus();
    }, [isExpanded]);

    useEffect(() => {
        if (!isExpanded) return;
        const handleMouseDown = (e) => {
            if (overlayRef.current && !overlayRef.current.contains(e.target)) setIsExpanded(false);
        };
        const handleKey = (e) => { if (e.key === 'Escape') setIsExpanded(false); };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isExpanded]);

    const handleInputChange = (event) => {
        if (!isControlled) setInternalValue(event.target.value);
        onChange?.(event);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch?.(inputValue.trim(), event);
        if (isIconOnly) setIsExpanded(false);
    };

    if (isIconOnly) {
        return (
            <>
                <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => setIsExpanded(true)}
                    aria-label={ariaLabel}
                >
                    <Icon name="search" size={18} color="#fff" fill="#fff" stroke="none" />
                </button>
                {isExpanded && (
                    <form
                        ref={overlayRef}
                        className={styles.searchOverlay}
                        role="search"
                        onSubmit={handleSubmit}
                    >
                        <span className={styles.iconWrapper}>
                            <Icon
                                name="search"
                                className={styles.searchIcon}
                                size={20}
                                color="currentColor"
                                label={ariaLabel}
                                fill="currentColor"
                                stroke="none"
                            />
                        </span>
                        <input
                            ref={inputRef}
                            id={id}
                            type="search"
                            className={styles.overlayInput}
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={handleInputChange}
                            aria-label={ariaLabel}
                            autoComplete="off"
                        />
                    </form>
                )}
            </>
        );
    }

    return (
        <form
            className={`input-group ${styles.searchForm} ${className}`.trim()}
            role="search"
            onSubmit={handleSubmit}
        >
            <span className={`input-group-text ${styles.iconWrapper}`}>
                <Icon
                    name="search"
                    className={styles.searchIcon}
                    size={24}
                    color="currentColor"
                    label={ariaLabel}
                    fill="currentColor"
                    stroke="none"
                />
            </span>
            <input
                id={id}
                type="search"
                className={`form-control ${styles.searchInput}`}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                aria-label={ariaLabel}
                autoComplete="off"
            />
        </form>
    );
}
