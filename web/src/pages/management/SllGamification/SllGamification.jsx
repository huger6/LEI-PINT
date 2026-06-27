import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getGamificationOverview } from '../../../features/gamification/api/gamificationApi';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import Icon from '../../../components/Icons/Icons';
import styles from './SllGamification.module.css';

// Read-only overview of the gamification system for a Service Line Leader:
// points-per-badge (SL scoped), available rewards, and badge milestones.
export default function SllGamification() {
	const { t } = useTranslation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(false);
			try {
				const res = await getGamificationOverview();
				if (active) setData(res);
			} catch {
				if (active) setError(true);
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	const pointsByBadge = data?.pointsByBadge || [];
	const rewards = data?.rewards || [];
	const milestones = data?.badgeMilestones || [];

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('sllGamification.title')}</h1>
			<p className={styles.pageSubtitle}>{t('sllGamification.subtitle')}</p>

			{loading ? (
				<CardGridSkeleton count={3} columns={1} />
			) : error ? (
				<ContentCard><p className={styles.empty}>{t('sllGamification.loadError')}</p></ContentCard>
			) : (
				<>
					{/* Points per badge (admin-defined, scoped to the leader's SL) */}
					<ContentCard className={styles.section}>
						<CardHeader icon="star-points" iconBg="var(--color-blue-soft)" iconColor="var(--color-blue-on-soft)" title={t('sllGamification.pointsTitle')} />
						<p className={styles.sectionDesc}>{t('sllGamification.pointsDesc')}</p>
						{pointsByBadge.length === 0 ? (
							<p className={styles.empty}>{t('sllGamification.pointsEmpty')}</p>
						) : (
							<div className={styles.tableWrap}>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>{t('sllGamification.colBadge')}</th>
											<th>{t('sllGamification.colArea')}</th>
											<th>{t('sllGamification.colType')}</th>
											<th className={styles.numCol}>{t('sllGamification.colPoints')}</th>
										</tr>
									</thead>
									<tbody>
										{pointsByBadge.map((b) => (
											<tr key={b.badgeSlug}>
												<td><TranslatedText text={b.badgeTitle} /></td>
												<td>{b.areaName || '—'}</td>
												<td>
													<span className={`${styles.typeTag} ${b.badgeType === 'Special' ? styles.typeSpecial : ''}`}>
														{b.badgeType === 'Special' ? t('sllGamification.typeSpecial') : t('sllGamification.typeStandard')}
													</span>
												</td>
												<td className={styles.numCol}>{b.badgePoints} {t('sllGamification.pts')}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</ContentCard>

					{/* Rewards available through the points/special-badge system */}
					<ContentCard className={styles.section}>
						<CardHeader icon="trophy" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('sllGamification.rewardsTitle')} />
						<p className={styles.sectionDesc}>{t('sllGamification.rewardsDesc')}</p>
						{rewards.length === 0 ? (
							<p className={styles.empty}>{t('sllGamification.rewardsEmpty')}</p>
						) : (
							<div className={styles.rewardGrid}>
								{rewards.map((r) => (
									<div key={r.rewardGuid} className={styles.rewardCard}>
										<div className={styles.rewardThumb}>
											{r.imgUrl
												? <img src={r.imgUrl} alt={r.name} className={styles.rewardImg} />
												: <Icon name="trophy" size={28} color="var(--color-purple-on-soft)" />}
										</div>
										<div className={styles.rewardBody}>
											<span className={styles.rewardName}>{r.name}</span>
											{r.description && <p className={styles.rewardDesc}>{r.description}</p>}
											<span className={styles.rewardCost}>
												<Icon name="star-points" size={14} color="var(--color-orange-on-soft)" />
												{r.costPoints} {t('sllGamification.pts')}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</ContentCard>

					{/* On-screen animation milestones */}
					<ContentCard className={styles.section}>
						<CardHeader icon="fire" iconBg="var(--color-orange-soft)" iconColor="var(--color-orange-on-soft)" title={t('sllGamification.milestonesTitle')} />
						<p className={styles.sectionDesc}>{t('sllGamification.milestonesDesc')}</p>
						<div className={styles.milestoneRow}>
							{milestones.map((m) => (
								<div key={m} className={styles.milestone}>
									<span className={styles.milestoneNum}>{m}</span>
									<span className={styles.milestoneLabel}>{t('sllGamification.badgesUnit', { count: m })}</span>
								</div>
							))}
						</div>
						<div className={styles.streakNote}>
							<Icon name="fire" size={18} color="var(--color-orange-on-soft)" />
							<span>{t('sllGamification.streakDesc')}</span>
						</div>
					</ContentCard>
				</>
			)}
		</div>
	);
}
