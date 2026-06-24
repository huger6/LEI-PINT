import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyBadge } from '../../../features/badges/api/publicBadgesApi';
import PreferencesBar from '../../../components/PreferencesBar/PreferencesBar';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import styles from './VerifyBadge.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

export default function VerifyBadge() {
	const { t, i18n } = useTranslation();
	const { link } = useParams();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setNotFound(false);
		verifyBadge(link)
			.then((d) => { if (active) { if (d) setData(d); else setNotFound(true); } })
			.catch(() => { if (active) setNotFound(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [link]);

	useEffect(() => {
		const prev = document.title;
		document.title = `${t('verifyBadge.title')} - Softinsa`;
		return () => { document.title = prev; };
	}, [t]);

	const fmtDate = (iso) => {
		if (!iso) return '—';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '—';
		return d.toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' });
	};

	const badge = data?.badge;
	const isExpired = Boolean(data?.is_expired);

	return (
		<div className={styles.site}>
			<header className={styles.nav}>
				<div className={styles.navInner}>
					<Link to="/softinsa" className={styles.brand}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.logoImg} />
					</Link>
					<PreferencesBar />
				</div>
			</header>

			<main className={styles.main}>
				{loading ? (
					<p className={styles.state}>{t('verifyBadge.loading')}</p>
				) : notFound || !data ? (
					<div className={styles.card}>
						<div className={`${styles.statusIcon} ${styles.invalid}`} aria-hidden="true">
							<i className="bi bi-x-lg" />
						</div>
						<h1 className={styles.statusTitle}>{t('verifyBadge.invalidTitle')}</h1>
						<p className={styles.statusDesc}>{t('verifyBadge.invalidDesc')}</p>
						<Link to="/softinsa" className={styles.btn}>{t('verifyBadge.exploreBadges')}</Link>
					</div>
				) : (
					<div className={styles.card}>
						<div className={`${styles.statusIcon} ${isExpired ? styles.expired : styles.valid}`} aria-hidden="true">
							<i className={`bi ${isExpired ? 'bi-clock-history' : 'bi-patch-check-fill'}`} />
						</div>
						<h1 className={styles.statusTitle}>
							{isExpired ? t('verifyBadge.expiredTitle') : t('verifyBadge.validTitle')}
						</h1>
						<p className={styles.statusDesc}>
							{isExpired ? t('verifyBadge.expiredDesc') : t('verifyBadge.validDesc')}
						</p>

						<div className={styles.credential}>
							<div className={styles.badgeImg}>
								{badge?.image ? <img src={badge.image} alt={badge.title || ''} /> : <span>🏅</span>}
							</div>
							<div className={styles.credInfo}>
								{badge?.type === 'Special' && <span className={styles.premium}>{t('verifyBadge.premium')}</span>}
								<h2 className={styles.badgeTitle}>{badge?.title || '—'}</h2>
								<p className={styles.recipient}>
									{t('verifyBadge.awardedTo')} <strong>{data.recipient?.full_name || '—'}</strong>
								</p>
								<dl className={styles.metaGrid}>
									<div>
										<dt>{t('verifyBadge.awardedAt')}</dt>
										<dd>{fmtDate(data.awarded_at)}</dd>
									</div>
									{data.expiration_at && (
										<div>
											<dt>{t('verifyBadge.expiresAt')}</dt>
											<dd className={isExpired ? styles.expiredText : undefined}>{fmtDate(data.expiration_at)}</dd>
										</div>
									)}
									{badge?.points != null && (
										<div>
											<dt>{t('verifyBadge.points')}</dt>
											<dd>{badge.points}</dd>
										</div>
									)}
								</dl>
							</div>
						</div>

						{badge?.description && <p className={styles.desc}><TranslatedText text={badge.description} /></p>}

						{badge?.slug && (
							<Link to={`/softinsa/badges/${badge.slug}`} className={styles.btn}>
								{t('verifyBadge.viewBadge')}
							</Link>
						)}
					</div>
				)}
			</main>

			<footer className={styles.footer}>
				<img src={LOGO_SRC} alt="Softinsa" className={styles.footerLogo} />
				<span>© {new Date().getFullYear()} Softinsa — An IBM Subsidiary.</span>
			</footer>
		</div>
	);
}
