import { Link } from 'react-router-dom';
import { CONSULTANT } from '../../../routes/paths';
import styles from './PointsCard.module.css';
import Icon from '../../Icons/Icons';

/**
 * Displays the consultant's gamification points total in the top bar.
 * @param {number} points - Current point total.
 */
export default function PointsCard({ points }) {
    return (
        <Link to={CONSULTANT.POINTS} className={styles.pointsCard}>
            <div className={styles.iconWrapper}>
                <Icon name="star-points" size={24} color="var(--color-secondary)" />
            </div>
            <span className={`${styles.pointsValue} fw-semibold`}>{points}</span>
        </Link>
    );
}
