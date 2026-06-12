import Icon from '../../../../components/Icons/Icons';
import styles from './StatusPanel.module.css';

const ICONS = {
    success: 'check',
    error: 'close',
};

export default function StatusPanel({
    variant = 'loading',
    title,
    message,
    children,
    loadingLabel,
}) {
    const isLoading = variant === 'loading';
    const iconName = ICONS[variant];
    const ariaLabel = loadingLabel || message || title || 'Loading';

    return (
        <div className={`${styles.panel} ${styles[variant]}`}>
            {isLoading ? (
                <div className={styles.spinner} role="status" aria-label={ariaLabel} />
            ) : (
                <div className={styles.icon} aria-hidden="true">
                    <Icon name={iconName} size={20} aria-hidden="true" />
                </div>
            )}
            {title && <h2 className={`mb-0 ${styles.title}`}>{title}</h2>}
            {message && <p className={`mb-0 small ${styles.message}`}>{message}</p>}
            {children && <div className={styles.actions}>{children}</div>}
        </div>
    );
}
