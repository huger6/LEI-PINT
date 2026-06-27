import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicBadge } from '../../../features/badges/api/publicBadgesApi';
import TranslatedText from '../../../components/TranslatedText/TranslatedText';
import SoftinsaNav from './SoftinsaNav';
import styles from './SoftinsaBadge.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

// Public page that displays the details of a single badge identified by its slug
export default function SoftinsaBadge() {
	// Translation helper for localized labels
	const { t } = useTranslation();
	// Read the badge slug from the route params
	const { slug } = useParams();
	// Holds the fetched badge data
	const [badge, setBadge] = useState(null);
	// Tracks whether the badge fetch is in progress
	const [loading, setLoading] = useState(true);
	// Flags when no badge matched the slug
	const [notFound, setNotFound] = useState(false);

	// Fetch the public badge whenever the slug changes
	useEffect(() => {
		let active = true;
		setLoading(true);
		getPublicBadge(slug)
			.then((b) => { if (active) { if (b) setBadge(b); else setNotFound(true); } })
			.catch(() => { if (active) setNotFound(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [slug]);

	// Sync the document title with the loaded badge and restore it on unmount
	useEffect(() => {
		const prev = document.title;
		if (badge) document.title = `${badge.badge_title} - Softinsa`;
		return () => { document.title = prev; };
	}, [badge]);

	// Build the list of meta fields to render, keeping only those present on the badge
	const meta = badge ? [
		badge.stage && { label: t('softinsaSite.badgePage.nivel'), value: `${badge.stage.code ? `${badge.stage.code} · ` : ''}${badge.stage.title || ''}` },
		badge.area && { label: t('softinsaSite.badgePage.area'), value: badge.area.name },
		badge.service_line && { label: t('softinsaSite.badgePage.serviceLine'), value: badge.service_line.name },
		badge.learning_path && { label: t('softinsaSite.badgePage.learningPath'), value: badge.learning_path.title },
	].filter(Boolean) : [];

	return (
		<div className={styles.site}>
			<SoftinsaNav />

			<main className={styles.main}>
				{loading ? (
					<p className={styles.state}>{t('softinsaSite.badgePage.loading')}</p>
				) : notFound || !badge ? (
					<div className={styles.state}>
						<h1>{t('softinsaSite.badgePage.notFound')}</h1>
						<Link to="/softinsa#badges" className={styles.btn}>{t('softinsaSite.badgePage.viewAll')}</Link>
					</div>
				) : (
					<>
						<section className={styles.hero}>
							<div className={styles.heroImg}>
								{badge.badge_img_url ? <img src={badge.badge_img_url} alt={badge.badge_title} /> : <span>🏅</span>}
							</div>
							<div className={styles.heroInfo}>
								{badge.badge_type === 'Special' && <span className={styles.premium}>{t('softinsaSite.badgePage.premium')}</span>}
								<h1><TranslatedText text={badge.badge_title} /></h1>
								<span className={styles.certified}>
									<i className="bi bi-patch-check-fill" aria-hidden="true" /> {t('softinsaSite.badgePage.certified')}
								</span>
								<p className={styles.desc}><TranslatedText text={badge.badge_description} /></p>
								<div className={styles.metaRow}>
									{meta.map((m) => (
										<div key={m.label} className={styles.metaItem}>
											<span className={styles.metaLabel}>{m.label}</span>
											<span className={styles.metaValue}>{m.value}</span>
										</div>
									))}
									<div className={styles.metaItem}>
										<span className={styles.metaLabel}>{t('softinsaSite.badgePage.points')}</span>
										<span className={styles.metaValue}>{badge.badge_points ?? 0}</span>
									</div>
									{badge.expiration_duration_days != null && (
										<div className={styles.metaItem}>
											<span className={styles.metaLabel}>{t('softinsaSite.badgePage.validity')}</span>
											<span className={styles.metaValue}>{t('softinsaSite.badgePage.days', { count: badge.expiration_duration_days })}</span>
										</div>
									)}
								</div>
							</div>
						</section>

						{badge.skills?.length > 0 && (
							<section className={styles.section}>
								<h2>{t('softinsaSite.badgePage.competencies')}</h2>
								<p className={styles.sectionSub}>{t('softinsaSite.badgePage.competenciesSub')}</p>
								<div className={styles.skillTags}>
									{badge.skills.map((s, i) => (
										<span key={i} className={styles.skillTag} title={s.description || undefined}>{s.name}</span>
									))}
								</div>
							</section>
						)}

						<section className={styles.section}>
							<h2>{t('softinsaSite.badgePage.requirements')}</h2>
							<p className={styles.sectionSub}>{t('softinsaSite.badgePage.requirementsSub')}</p>
							{badge.requirements?.length > 0 ? (
								<div className={styles.reqGrid}>
									{badge.requirements.map((r, i) => (
										<article key={i} className={styles.reqCard}>
											<span className={styles.reqNum}>{String(i + 1).padStart(2, '0')}</span>
											<h3><TranslatedText text={r.title} /></h3>
											{r.description && <p><TranslatedText text={r.description} /></p>}
										</article>
									))}
								</div>
							) : (
								<p className={styles.muted}>{t('softinsaSite.badgePage.noRequirements')}</p>
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
