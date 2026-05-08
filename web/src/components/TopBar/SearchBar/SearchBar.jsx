import { useState } from 'react';
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
