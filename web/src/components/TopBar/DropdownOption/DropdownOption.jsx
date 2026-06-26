import { useTranslation } from 'react-i18next';
import Icon from '../../Icons/Icons';
import styles from './DropdownOption.module.css';

const FILLED_ICONS = new Set(['moon', 'privacy', 'security', 'close', 'asterisk']);

/**
 * Reusable menu option for dropdown menus with icon and label.
 * @param {string} [icon] - Icon name.
 * @param {string} label - Display label (supports i18n translation keys).
 * @param {Function} [onClick] - Click handler.
 * @param {string|Component} [as='button'] - Polymorphic root element.
 */
// Renders a polymorphic dropdown menu item with an optional icon and translated label.
export default function DropdownOption({
    as = 'button',
    icon,
    iconSize = 20,
    label,
    onClick,
    className = '',
    ...rest
}) {
    // Provides the translation function for resolving i18n label keys.
    const { t } = useTranslation();
    const Component = as;
    const isTranslationKey = typeof label === 'string' && label.includes('.');
    const translatedLabel = label
        ? (isTranslationKey ? t(label, { defaultValue: label }) : label)
        : '';
    const shouldRenderFilled = typeof icon === 'string' && FILLED_ICONS.has(icon);

    return (
        <Component
            type={Component === 'button' ? 'button' : undefined}
            className={`${styles.dropdownOption} ${className}`.trim()}
            onClick={onClick}
            aria-label={translatedLabel}
            {...rest}
        >
            <span className={styles.icon}>
                {icon ? (
                    <Icon
                        name={icon}
                        size={iconSize}
                        color="var(--color-on-background)"
                        aria-label={translatedLabel}
                        {...(shouldRenderFilled ? { fill: 'currentColor', stroke: 'none' } : {})}
                    />
                ) : null}
            </span>
            <span className={styles.label}>{translatedLabel}</span>
        </Component>
    );
}
