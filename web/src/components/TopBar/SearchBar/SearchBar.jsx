import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';
import Icon from '../../Icons/Icons';

/**
 * Global search bar. Renders inline on desktop, expands from icon on mobile.
 * @param {string} [placeholder] - Input placeholder text.
 * @param {Function} [onSearch] - Called with the trimmed query on form submit.
 * @param {Function} [onChange] - Called on every input change (controlled mode).
 */
// Renders an inline search form on desktop and an expandable icon-button on mobile.
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
    // Holds the uncontrolled input value when the component is used without a value prop.
    const [internalValue, setInternalValue] = useState(defaultValue);
    // Tracks whether to render icon-only mode based on the current viewport width.
    const [isIconOnly, setIsIconOnly] = useState(() => window.matchMedia('(max-width: 991px)').matches);
    // Tracks whether the mobile search overlay is expanded.
    const [isExpanded, setIsExpanded] = useState(false);
    // Ref to the text input for programmatic focus when the overlay opens.
    const inputRef = useRef(null);
    // Ref to the overlay form element for detecting outside clicks.
    const overlayRef = useRef(null);

    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;

    // Watches the mobile breakpoint media query and collapses the overlay when switching to desktop.
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 991px)');
        const handler = (e) => {
            setIsIconOnly(e.matches);
            if (!e.matches) setIsExpanded(false);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Focuses the input element whenever the mobile search overlay becomes expanded.
    useEffect(() => {
        if (isExpanded && inputRef.current) inputRef.current.focus();
    }, [isExpanded]);

    // Attaches outside-click and Escape key listeners to collapse the mobile overlay.
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

    // Updates the internal value for uncontrolled usage and forwards the event to onChange.
    const handleInputChange = (event) => {
        if (!isControlled) setInternalValue(event.target.value);
        onChange?.(event);
    };

    // Prevents default form submission and passes the trimmed query to the onSearch callback.
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
                    <Icon name="search" size={20} color="currentColor" fill="currentColor" stroke="none" />
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
                                aria-label={ariaLabel}
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
                    aria-label={ariaLabel}
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
