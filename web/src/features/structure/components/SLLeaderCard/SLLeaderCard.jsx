import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../../components/Icons/Icons';
import styles from './SLLeaderCard.module.css';
import { ADMIN } from '../../../../routes/paths';

/**
 * Displays the Service Line Leader's profile card on Service Line detail pages.
 * @param {Object} leader - Leader user data (name, avatar, email).
 */
export default function SLLeaderCard({ leader }) {
	// i18n translation function
	const { t } = useTranslation();

	if (!leader) return null;

	// Build the leader's profile route by injecting their guid
	const profilePath = ADMIN.USER_PROFILE.replace(':guid', leader.user_guid);

	return (
		<div className={styles.wrapper}>
			<h2 className={styles.title}>
				{t('structureDetail.serviceLineLeader', { defaultValue: 'Service Line Leader' })}
			</h2>
			<Link to={profilePath} className={styles.card}>
				<div className={styles.avatar}>
					{leader.profile_img_url ? (
						<img src={leader.profile_img_url} alt={leader.full_name} className={styles.avatarImg} />
					) : (
						<Icon name="tabler_users" size={28} color="var(--color-primary)" />
					)}
				</div>
				<div className={styles.info}>
					<span className={styles.name}>{leader.full_name}</span>
					<span className={styles.username}>@{leader.username}</span>
				</div>
				<div className={styles.arrow}>
					<Icon name="chevron_forward" size={20} />
				</div>
			</Link>
		</div>
	);
}
