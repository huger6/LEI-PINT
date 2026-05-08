import { useState } from 'react';
import styles from './SearchBar.module.css';

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
    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;

    const handleInputChange = (event) => {
        if (!isControlled) {
            setInternalValue(event.target.value);
        }
        onChange?.(event);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch?.(inputValue.trim(), event);
    };

    return (
        <form
            className={`input-group ${styles.searchForm} ${className}`.trim()}
            role="search"
            onSubmit={handleSubmit}
        >
            <span className={`input-group-text ${styles.iconWrapper}`}>
                <svg
                    className={styles.searchIcon}
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    fill="currentColor"
                >
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.414-1.415l-3.85-3.85h-.016Zm-5.242.656a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                </svg>
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
