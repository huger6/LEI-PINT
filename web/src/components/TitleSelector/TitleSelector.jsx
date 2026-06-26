import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getTitles, setActiveTitle } from '../../features/rewards/api/rewardsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import ContentCard, { CardHeader } from '../ContentCard/ContentCard';
import Icon from '../Icons/Icons';
import styles from './TitleSelector.module.css';

// Lets a consultant pick which unlocked special title is shown publicly on their
// profile. Self-contained: fetches the unlocked titles and renders nothing when
// the user has none, so it is safe to drop into any page (e.g. Settings).
export default function TitleSelector() {
	// Translation helper
	const { t } = useTranslation();
	// Titles the consultant has unlocked
	const [titles, setTitles] = useState([]);
	// The title currently displayed publicly (null = none)
	const [activeTitle, setActiveTitleState] = useState(null);
	// In-flight title-change flag
	const [saving, setSaving] = useState(false);
	// Error message to display
	const [error, setError] = useState(null);

	// Load the unlocked titles and the currently active one
	const load = useCallback(async () => {
		try {
			const data = await getTitles();
			setTitles(data.titles || []);
			setActiveTitleState(data.activeTitle || null);
		} catch {
			// Silent: a missing titles endpoint shouldn't break the settings page.
		}
	}, []);

	// Fetch on mount
	useEffect(() => { load(); }, [load]);

	// Set (or clear) the publicly displayed title; optimistic with revert on error
	async function chooseTitle(title) {
		const prev = activeTitle;
		setActiveTitleState(title);
		setSaving(true);
		setError(null);
		try {
			await setActiveTitle(title);
		} catch (err) {
			setActiveTitleState(prev);
			setError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	}

	// Nothing unlocked yet → render nothing
	if (titles.length === 0) return null;

	return (
		<ContentCard className={styles.section}>
			<CardHeader icon="badge-premium" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('store.myTitle')} />
			<p className={styles.hint}>{t('store.myTitleHint')}</p>
			{error && <div className="alert alert-danger" role="alert">{error}</div>}
			<div className={styles.titlesRow}>
				<button
					type="button"
					className={`${styles.titleChip} ${!activeTitle ? styles.titleChipActive : ''}`}
					onClick={() => chooseTitle(null)}
					disabled={saving}
				>
					{t('store.noTitle')}
				</button>
				{titles.map((title) => (
					<button
						key={title}
						type="button"
						className={`${styles.titleChip} ${activeTitle === title ? styles.titleChipActive : ''}`}
						onClick={() => chooseTitle(title)}
						disabled={saving}
					>
						<Icon name="badge-premium" size={14} aria-hidden="true" /> {title}
					</button>
				))}
			</div>
		</ContentCard>
	);
}
