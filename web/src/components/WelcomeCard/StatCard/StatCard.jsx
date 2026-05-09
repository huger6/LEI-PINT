import styles from './StatCard.module.css';
import Icon from '../../Icons/Icons';

export default function StatCard({ label, value, variant }) {
    const variantClass = variant === 'accent' ? styles.accent
        : variant === 'success' ? styles.success
            : '';

    return (
        <div className={`${styles.card} ${variantClass}`}>
            <div className='d-flex justify-content-center'>
                <Icon name="fire" size={32} color="#fff" />
            </div>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
        </div>
    );
}
