import { Link } from 'react-router-dom';
import styles from './StatCard.module.css';
import Icon from '../../Icons/Icons';

/**
 * KPI stat card shown in the welcome banner. Optionally links to a detail page.
 * @param {string} label - Stat description.
 * @param {string|number} value - Stat value.
 * @param {'accent'|'success'} [variant] - Color variant.
 * @param {string} [icon] - Icon name.
 * @param {string} [to] - Link destination. If provided, the card becomes clickable.
 */
export default function StatCard({ label, value, variant, iconName, icon, iconColor = 'var(--color-on-primary)', to }) {
    const variantClass = variant === 'accent' ? styles.accent
        : variant === 'success' ? styles.success
            : '';

    const body = (
        <>
            <div className='d-flex justify-content-center'>
                <Icon name={iconName ?? icon} size={32} color={iconColor} />
            </div>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
        </>
    );

    // When a destination is provided the card becomes a link to the matching page.
    if (to) {
        return (
            <Link to={to} className={`${styles.card} ${styles.clickable} ${variantClass}`}>
                {body}
            </Link>
        );
    }

    return (
        <div className={`${styles.card} ${variantClass}`}>
            {body}
        </div>
    );
}
