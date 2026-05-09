import styles from './StatusPanel.module.css';

const ICONS = {
    success: 'bi bi-check-lg',
    error: 'bi bi-x-lg',
};

export default function StatusPanel({
    variant = 'loading',
    title,
    message,
    children,
    loadingLabel,
}) {
    const isLoading = variant === 'loading';
    const iconClass = ICONS[variant];
    const ariaLabel = loadingLabel || message || title || 'Loading';

    return (
        <div className={`${styles.panel} ${styles[variant]}`}>
            {isLoading ? (
                <div className={styles.spinner} role="status" aria-label={ariaLabel} />
            ) : (
                <div className={styles.icon} aria-hidden="true">
                    <i className={iconClass} />
                </div>
            )}
            {title && <h2 className={`mb-0 ${styles.title}`}>{title}</h2>}
            {message && <p className={`mb-0 small ${styles.message}`}>{message}</p>}
            {children && <div className={styles.actions}>{children}</div>}
        </div>
    );
}
