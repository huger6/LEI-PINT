import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../hooks/userContext';
import { getTitles, setActiveTitle } from '../../features/rewards/api/rewardsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import Icon from '../Icons/Icons';
import styles from './TitleSelector.module.css';

// Lets a consultant pick which unlocked special title is shown publicly on their
// profile. Self-contained: fetches the unlocked titles and renders nothing when
// the user has none, so it is safe to drop into any page (e.g. Settings).
export default function TitleSelector() {
	const { t } = useTranslation();
	const { refreshUser } = useUser();
	const [titles, setTitles] = useState([]);
	const [activeRewardGuid, setActiveRewardGuid] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	const load = useCallback(async () => {
		try {
			const data = await getTitles();
			setTitles(data.titles || []);
			setActiveRewardGuid(data.activeTitleRewardGuid || null);
		} catch {
			// Silent: a missing titles endpoint shouldn't break the settings page.
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	async function chooseTitle(rewardGuid) {
		const prev = activeRewardGuid;
		setActiveRewardGuid(rewardGuid);
		setSaving(true);
		setError(null);
		try {
			await setActiveTitle(rewardGuid);
			await refreshUser();
		} catch (err) {
			setActiveRewardGuid(prev);
			setError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	}

	if (titles.length === 0) return null;

	return (
		<ContentCard className={styles.section}>
			<CardHeader icon="badge-premium" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('store.myTitle')} />
			<p className={styles.hint}>{t('store.myTitleHint')}</p>
			{error && <div className="alert alert-danger" role="alert">{error}</div>}
			<div className={styles.titlesRow}>
				<button
					type="button"
					className={`${styles.titleChip} ${!activeRewardGuid ? styles.titleChipActive : ''}`}
					onClick={() => chooseTitle(null)}
					disabled={saving}
				>
					{t('store.noTitle')}
				</button>
				{titles.map((item) => (
					<button
						key={item.rewardGuid}
						type="button"
						className={`${styles.titleChip} ${activeRewardGuid === item.rewardGuid ? styles.titleChipActive : ''}`}
						onClick={() => chooseTitle(item.rewardGuid)}
						disabled={saving}
					>
						<Icon name="badge-premium" size={14} aria-hidden="true" /> {item.title}
					</button>
				))}
			</div>
		</ContentCard>
	);
}
