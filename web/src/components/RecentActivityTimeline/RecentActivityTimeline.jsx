import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SHARED } from '../../routes/paths';
import Icon from '../Icons/Icons';
import TranslatedText from '../TranslatedText/TranslatedText';
import styles from './RecentActivityTimeline.module.css';

// Visual styling per event type in the mixed team activity feed.
const EVENT_META = {
	badge_awarded: { icon: 'trophy', color: 'var(--color-green-on-soft)', bg: 'var(--color-green-soft)' },
	application_submitted: { icon: 'paper', color: 'var(--color-blue-on-soft)', bg: 'var(--color-blue-soft)' },
};

// Format a date string into a localized date and time string.
function formatDateTime(dateStr) {
	if (!dateStr) return '';
	const d = new Date(dateStr);
	return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
		+ ' · '
		+ d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// Single chronological feed mixing recent team events (awarded badges +
// submitted applications) across all consultants in scope.
export default function RecentActivityTimeline({ events = [] }) {
	const { t } = useTranslation();

	if (!events.length) {
		return <p className={styles.empty}>{t('recentActivity.empty')}</p>;
	}

	return (
		<ul className={styles.list}>
			{events.map((e, idx) => {
				const meta = EVENT_META[e.event_type] || EVENT_META.application_submitted;
				const action = e.event_type === 'badge_awarded'
					? t('recentActivity.awarded')
					: t('recentActivity.submitted');
				return (
					<li key={`${e.event_type}-${e.consultant_guid}-${e.event_at}-${idx}`} className={styles.item}>
						<span className={styles.icon} style={{ background: meta.bg }}>
							<Icon name={meta.icon} size={16} color={meta.color} />
						</span>
						<div className={styles.body}>
							<p className={styles.text}>
								<span className={styles.name}>{e.consultant_name}</span>
								{' '}{action}{' '}
								{e.badge_slug
									? <Link className={styles.badgeLink} to={SHARED.BADGE_DETAIL.replace(':slug', e.badge_slug)}><TranslatedText text={e.badge_title} /></Link>
									: <span className={styles.badge}><TranslatedText text={e.badge_title} /></span>}
							</p>
							<span className={styles.meta}>
								{e.area_name ? `${e.area_name} · ` : ''}{formatDateTime(e.event_at)}
							</span>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
