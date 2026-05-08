import { useTranslation } from 'react-i18next';
import Icon from '../../Icons/Icons';
import styles from './DropdownOption.module.css';

const BOOTSTRAP_ICON_MAP = {
    'bi-envelope': 'email',
    'bi-person': 'user',
    'bi-circle-half': 'moon',
    'bi-shield': 'privacy',
    'bi-lock': 'security',
    'bi-house': 'home',
    'bi-award': 'badge',
    'bi-file-earmark-text': 'paper',
    'bi-trophy': 'trophy',
    'bi-star': 'star',
    'bi-bullseye': 'target',
    'bi-graph-up-arrow': 'evolution',
    'bi-megaphone': 'megaphone',
    'bi-gear': 'settings',
    'bi-x-lg': 'close',
    'bi-check-lg': 'check',
    'bi-asterisk': 'asterisk',
};
const FILLED_BOOTSTRAP_ICONS = new Set(['bi-circle-half', 'bi-shield', 'bi-lock', 'bi-x-lg', 'bi-asterisk']);

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
    const mappedBootstrapIcon = bootstrapIcon ? BOOTSTRAP_ICON_MAP[bootstrapIcon] : null;
    const resolvedIconName = mappedBootstrapIcon || icon;
    const iconSize = mappedBootstrapIcon ? 18 : 20;
    const shouldRenderFilled = bootstrapIcon ? FILLED_BOOTSTRAP_ICONS.has(bootstrapIcon) : false;

    return (
        <Component
            type={Component === 'button' ? 'button' : undefined}
            className={`${styles.dropdownOption} ${className}`.trim()}
            onClick={onClick}
            aria-label={translatedLabel}
            {...rest}
        >
            <span className={styles.icon}>
                {resolvedIconName ? (
                    <Icon
                        name={resolvedIconName}
                        size={iconSize}
                        color="var(--color-on-background)"
                        label={translatedLabel}
                        {...(shouldRenderFilled ? { fill: 'currentColor', stroke: 'none' } : {})}
                    />
                ) : null}
            </span>
            <span className={styles.label}>{translatedLabel}</span>
        </Component>
    );
}
