import { useTranslation } from 'react-i18next';
import Icon from '../../Icons/Icons';
import styles from './DropdownOption.module.css';

export default function DropdownOption({
    as = 'button',
    icon,
    bootstrapIcon,
    label,
    onClick,
    className = '',
    ...rest
}) {
    const { t } = useTranslation();
    const Component = as;
    const isTranslationKey = typeof label === 'string' && label.includes('.');
    const translatedLabel = label
        ? (isTranslationKey ? t(label, { defaultValue: label }) : label)
        : '';

    return (
        <Component
            type={Component === 'button' ? 'button' : undefined}
            className={`${styles.dropdownOption} ${className}`.trim()}
            onClick={onClick}
            aria-label={translatedLabel}
            {...rest}
        >
            <span className={styles.icon}>
                {bootstrapIcon ? (
                    <i className={`bi ${bootstrapIcon}`} aria-hidden="true" />
                ) : icon ? (
                    <Icon name={icon} size={20} color="var(--color-on-background)" label={translatedLabel} />
                ) : null}
            </span>
            <span className={styles.label}>{translatedLabel}</span>
        </Component>
    );
}
