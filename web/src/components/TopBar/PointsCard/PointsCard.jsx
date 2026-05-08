import styles from './PointsCard.module.css';
import Icon from '../../Icons/Icons';

export default function PointsCard({ points }) {
    return (
        <div className={styles.pointsCard}>
            <div className={styles.iconWrapper}>
                <Icon name="star-points" size={24} color="var(--color-secondary)" />
            </div>
            <span className={`${styles.pointsValue} fw-semibold`}>{points}</span>
        </div>
    );
}
