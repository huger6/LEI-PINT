import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRewards, getRedemptions, redeemReward } from '../../../features/rewards/api/rewardsApi';
import { useUser } from '../../../hooks/userContext';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import Modal from '../../../components/Modal/Modal';
import Spinner from '../../../components/Spinner/Spinner';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './Store.module.css';

// Format a date string into a localized "dd month year" label
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

const CATEGORY_STYLE = {
	course:       { icon: 'certificate',   bg: 'var(--color-primary-soft)',  color: 'var(--color-primary)' },
	voucher:      { icon: 'star-points',   bg: 'var(--color-orange-soft)',   color: 'var(--color-orange-on-soft)' },
	title:        { icon: 'badge-premium', bg: 'var(--color-purple-soft)',   color: 'var(--color-purple-on-soft)' },
	physical:     { icon: 'trophy',        bg: 'var(--color-green-soft)',    color: 'var(--color-green-on-soft)' },
	subscription: { icon: 'skills',        bg: 'var(--color-blue-soft)',     color: 'var(--color-blue-on-soft)' },
};
const DEFAULT_STYLE = { icon: 'certificate', bg: 'var(--color-primary-soft)', color: 'var(--color-primary)' };

// Rewards store page: lists rewards, handles point redemption and history
export default function Store() {
	// Translation helper
	const { t } = useTranslation();
	// Refresh the user's point balance after a redemption
	const { refreshPoints } = useUser();
	// Current point balance
	const [balance, setBalance] = useState(0);
	// Available rewards catalog
	const [rewards, setRewards] = useState([]);
	// Past redemption history
	const [redemptions, setRedemptions] = useState([]);
	// Initial load flag
	const [loading, setLoading] = useState(true);
	const [confirm, setConfirm] = useState(null);   // reward pending confirmation
	// In-flight redemption flag
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState(null);     // { name, accessLink, accessInfo }
	// Error message to display
	const [error, setError] = useState(null);

	// Load rewards, balance and redemption history together
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [store, hist] = await Promise.all([getRewards(), getRedemptions()]);
			setBalance(store.balance || 0);
			setRewards(store.rewards || []);
			setRedemptions(hist || []);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, []);

	// Run the initial data load on mount
	useEffect(() => { load(); }, [load]);

	// Redeem the confirmed reward and refresh state on success
	async function handleRedeem() {
		if (!confirm) return;
		setBusy(true);
		setError(null);
		try {
			const data = await redeemReward(confirm.rewardGuid);
			setConfirm(null);
			setResult(data);
			refreshPoints?.();
			await load();
		} catch (err) {
			setError(resolveErrorMessage(err));
			setConfirm(null);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>{t('store.title')}</h1>
					<p className={styles.subtitle}>{t('store.subtitle')}</p>
				</div>
				<div className={styles.balance}>
					<Icon name="star-points" size={20} color="var(--color-warning)" aria-hidden="true" />
					<span className={styles.balanceValue}>{Number(balance).toLocaleString('pt-PT')}</span>
					<span className={styles.balanceLabel}>{t('store.points')}</span>
				</div>
			</div>

			{error && <div className="alert alert-danger" role="alert">{error}</div>}

			{loading ? (
				<Spinner />
			) : rewards.length === 0 ? (
				<ContentCard><p className={styles.empty}>{t('store.empty')}</p></ContentCard>
			) : (
				<div className={styles.grid}>
					{rewards.map((r) => {
						const affordable = balance >= r.costPoints;
						const cs = CATEGORY_STYLE[r.category] || DEFAULT_STYLE;
						return (
							<ContentCard key={r.rewardGuid} className={styles.card}>
								<div className={styles.cardIcon} style={{ background: cs.bg }}><Icon name={cs.icon} size={26} color={cs.color} aria-hidden="true" /></div>
								<h3 className={styles.cardTitle}>{r.name}</h3>
								{r.description && <p className={styles.cardDesc}><TranslatedText text={r.description} /></p>}
								<div className={styles.cardFooter}>
									<span className={styles.cost}>
										<Icon name="star-points" size={16} color="var(--color-warning)" aria-hidden="true" /> {r.costPoints} {t('store.points')}
									</span>
									<Button
										size="sm"
										disabled={!affordable}
										onClick={() => { setError(null); setConfirm(r); }}
									>
										{affordable ? t('store.redeem') : t('store.notEnough')}
									</Button>
								</div>
							</ContentCard>
						);
					})}
				</div>
			)}

			{/* Redemption history */}
			{redemptions.length > 0 && (
				<ContentCard className={styles.historyCard}>
					<CardHeader icon="time" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('store.myRedemptions')} />
					<ul className={styles.historyList}>
						{redemptions.map((h) => (
							<li key={h.redemptionGuid} className={styles.historyItem}>
								<div className={styles.historyInfo}>
									<span className={styles.historyName}>{h.name}</span>
									<span className={styles.historyMeta}>{fmtDate(h.redeemedAt)} · −{h.pointsSpent} {t('store.points')}</span>
								</div>
								{h.accessLink && (
									<a href={h.accessLink} target="_blank" rel="noopener noreferrer" className={styles.historyLink}>
										<Icon name="link" size={14} aria-hidden="true" /> {t('store.access')}
									</a>
								)}
							</li>
						))}
					</ul>
				</ContentCard>
			)}

			{/* Confirm */}
			{confirm && (
				<Modal title={t('store.confirmTitle')} onClose={() => setConfirm(null)}>
					<p className={styles.modalText}>{t('store.confirmText', { name: confirm.name, cost: confirm.costPoints })}</p>
					<div className={styles.modalActions}>
						<Button variant="outlined" color="primary" onClick={() => setConfirm(null)} disabled={busy}>{t('shared.cancel')}</Button>
						<Button onClick={handleRedeem} loading={busy}>{t('store.redeem')}</Button>
					</div>
				</Modal>
			)}

			{/* Success */}
			{result && (
				<Modal title={t('store.successTitle')} onClose={() => setResult(null)}>
					<div className={styles.successBody}>
						<div className={styles.successIcon}><Icon name="check_circle" size={36} color="var(--color-success)" aria-hidden="true" /></div>
						<p className={styles.modalText}>{t('store.successText', { name: result.name })}</p>
						{result.accessInfo && <p className={styles.accessInfo}>{result.accessInfo}</p>}
						{result.accessLink && (
							<Button as="a" href={result.accessLink} target="_blank" rel="noopener noreferrer">
								<Icon name="link" size={16} aria-hidden="true" /> {t('store.access')}
							</Button>
						)}
						<p className={styles.emailNote}><Icon name="email" size={14} color="var(--color-outline)" aria-hidden="true" /> {t('store.emailNote')}</p>
					</div>
				</Modal>
			)}
		</div>
	);
}
