import { useTranslation } from 'react-i18next';
import Icon from '../../Icons/Icons';
import Tooltip from '../../Tooltip/Tooltip';
import styles from './SidebarOption.module.css';

export default function SidebarOption({
    as = 'button',
    icon,
    label,
    onClick,
    active = false,
    news = false,
    collapsed = false,
    className = '',
    ...rest
}) {
    const { t } = useTranslation();
    const Component = as;
    const isTranslationKey = typeof label === 'string' && label.includes('.');
    const translatedLabel = label
        ? (isTranslationKey ? t(label, { defaultValue: label }) : label)
        : icon;

    const buttonClassName = [
        styles.sidebarOption,
        active ? styles.active : '',
        collapsed ? styles.collapsed : '',
        className,
    ].filter(Boolean).join(' ');

    const element = (
        <Component
            type={Component === 'button' ? 'button' : undefined}
            className={buttonClassName}
            onClick={onClick}
            aria-label={translatedLabel}
            {...rest}
        >
            <div className={styles.content}>
                <span className={`${styles.icon}${news ? ` ${styles.hasNews}` : ''}`}>
                    <Icon
                        name={icon}
                        size={24}
                        color="var(--color-on-background)"
                        aria-label={translatedLabel}
                    />
                </span>
                <span className={styles.label}>{translatedLabel}</span>
                {news && <span className={styles.newsDot} aria-hidden="true" />}
            </div>
        </Component>
    );

    if (collapsed) {
        return (
            <Tooltip text={translatedLabel} position="right">
                {element}
            </Tooltip>
        );
    }

    return element;
}
