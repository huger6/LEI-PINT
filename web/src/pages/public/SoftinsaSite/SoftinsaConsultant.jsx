import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicConsultant } from '../../../features/badges/api/publicBadgesApi';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import SoftinsaNav from './SoftinsaNav';
import styles from './SoftinsaBadge.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

// Public page that shows a consultant's profile and earned badges by GUID
export default function SoftinsaConsultant() {
	// Translation helper and active i18n instance for date locale
	const { t, i18n } = useTranslation();
	// Read the consultant GUID from the route params
	const { guid } = useParams();
	// Holds the fetched consultant profile
	const [profile, setProfile] = useState(null);
	// Tracks whether the profile fetch is in progress
	const [loading, setLoading] = useState(true);
	// Flags when no profile matched the GUID
	const [notFound, setNotFound] = useState(false);

	// Fetch the public consultant profile whenever the GUID changes
	useEffect(() => {
		let active = true;
		setLoading(true);
		setNotFound(false);
		getPublicConsultant(guid)
			.then((p) => { if (active) { if (p) setProfile(p); else setNotFound(true); } })
			.catch(() => { if (active) setNotFound(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [guid]);

	// Sync the document title with the loaded profile and restore it on unmount
	useEffect(() => {
		const prev = document.title;
		if (profile) document.title = `${profile.full_name} - Softinsa`;
		return () => { document.title = prev; };
	}, [profile]);

	// Format an ISO date as a localized month/year string
	const fmtDate = (iso) => {
		if (!iso) return '';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' });
	};

	return (
		<div className={styles.site}>
			<SoftinsaNav />

			<main className={styles.main}>
				{loading ? (
					<p className={styles.state}>{t('softinsaSite.badgePage.loading')}</p>
				) : notFound || !profile ? (
					<div className={styles.state}>
						<h1>{t('softinsaConsultant.notFound')}</h1>
						<Link to="/softinsa" className={styles.btn}>{t('softinsaSite.badgePage.viewAll')}</Link>
					</div>
				) : (
					<>
						<section className={styles.hero}>
							<div className={styles.heroImg}>
								<Avatar src={profile.profile_img_url} name={profile.full_name} size={96} />
							</div>
							<div className={styles.heroInfo}>
								<h1>{profile.full_name}</h1>
								{profile.title && <span className={styles.userTitle}>{profile.title}</span>}
								{profile.role && <span className={styles.premium}>{t(`roles.${profile.role}`, profile.role)}</span>}
								<div className={styles.metaRow}>
									<div className={styles.metaItem}>
										<span className={styles.metaLabel}>{t('softinsaConsultant.badges')}</span>
										<span className={styles.metaValue}>{profile.total_badges}</span>
									</div>
									<div className={styles.metaItem}>
										<span className={styles.metaLabel}>{t('softinsaConsultant.points')}</span>
										<span className={styles.metaValue}>{profile.total_points}</span>
									</div>
								</div>
							</div>
						</section>

						<section className={styles.section}>
							<h2>{t('softinsaConsultant.earnedBadges')}</h2>
							{profile.badges.length > 0 ? (
								<div className={styles.reqGrid}>
									{profile.badges.map((b, i) => {
										const Wrapper = b.slug ? Link : 'div';
										const props = b.slug ? { to: `/softinsa/badges/${b.slug}` } : {};
										return (
											<Wrapper key={i} {...props} className={styles.reqCard} style={{ textDecoration: 'none', color: 'inherit' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
													{b.image
														? <img src={b.image} alt={b.title || ''} style={{ width: 48, height: 48, objectFit: 'contain' }} />
														: <Icon name="badge" size={40} color="var(--color-secondary)" aria-hidden="true" />}
													<div>
														<h3 style={{ margin: 0 }}><TranslatedText text={b.title} />{b.type === 'Special' ? ' ⭐' : ''}</h3>
														<p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
															{fmtDate(b.awarded_at)} · {b.points ?? 0} pts{b.is_expired ? ` · ${t('softinsaConsultant.expired')}` : ''}
														</p>
													</div>
												</div>
											</Wrapper>
										);
									})}
								</div>
							) : (
								<p className={styles.muted}>{t('softinsaConsultant.noBadges')}</p>
							)}
						</section>
					</>
				)}
			</main>

			<footer className={styles.footer}>
				<img src={LOGO_SRC} alt="Softinsa" className={styles.footerLogo} />
				<span>© {new Date().getFullYear()} Softinsa — An IBM Subsidiary.</span>
			</footer>
		</div>
	);
}
