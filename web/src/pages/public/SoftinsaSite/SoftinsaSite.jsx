import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPublicBadges } from '../../../features/badges/api/publicBadgesApi';
import styles from './SoftinsaSite.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';
const HERO_IMG = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80';
const ABOUT_IMG = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80';

const FEATURE_ICONS = ['🎯', '🏅', '🎮', '✅', '📊', '🌐'];
const STEP_NUMS = ['01', '02', '03', '04'];
const LANGS = [{ code: 'pt', label: 'PT' }, { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }];

const Social = ({ label, children, href = 'https://softinsa.pt' }) => (
	<a className={styles.social} href={href} target="_blank" rel="noreferrer" aria-label={label}>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">{children}</svg>
	</a>
);

export default function SoftinsaSite() {
	const { t, i18n } = useTranslation();
	const rootRef = useRef(null);
	const [badges, setBadges] = useState([]);

	useEffect(() => {
		const prev = document.title;
		document.title = `${t('softinsaSite.hero.title')} - Softinsa`;
		return () => { document.title = prev; };
	}, [t]);

	useEffect(() => {
		let active = true;
		getPublicBadges().then((rows) => { if (active) setBadges(rows); }).catch(() => {});
		return () => { active = false; };
	}, []);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return undefined;
		const els = root.querySelectorAll(`.${styles.reveal}`);
		if (!('IntersectionObserver' in window)) {
			els.forEach((el) => el.classList.add(styles.revealVisible));
			return undefined;
		}
		const io = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) { e.target.classList.add(styles.revealVisible); io.unobserve(e.target); }
			});
		}, { threshold: 0.12 });
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, [badges]);

	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	const features = t('softinsaSite.features.items', { returnObjects: true });
	const profiles = t('softinsaSite.profiles.items', { returnObjects: true });
	const steps = t('softinsaSite.flow.items', { returnObjects: true });
	const links = t('softinsaSite.footer.links', { returnObjects: true });
	const policies = t('softinsaSite.footer.policies', { returnObjects: true });
	const arr = (v) => (Array.isArray(v) ? v : []);

	return (
		<div className={styles.site} ref={rootRef}>
			<header className={styles.nav}>
				<div className={styles.navInner}>
					<a href="#top" className={styles.brand}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.logoImg} />
					</a>
					<nav className={styles.navLinks}>
						<a href="#sobre">{t('softinsaSite.nav.sobre')}</a>
						<a href="#funcionalidades">{t('softinsaSite.nav.funcionalidades')}</a>
						<a href="#badges">{t('softinsaSite.nav.badges')}</a>
						<a href="#perfis">{t('softinsaSite.nav.perfis')}</a>
						<a href="#fluxo">{t('softinsaSite.nav.comoFunciona')}</a>
					</nav>
					<div className={styles.navRight}>
						<div className={styles.langSwitch}>
							{LANGS.map((l) => (
								<button key={l.code} type="button"
									className={`${styles.langBtn} ${i18n.resolvedLanguage === l.code ? styles.langActive : ''}`}
									onClick={() => i18n.changeLanguage(l.code)}>
									{l.label}
								</button>
							))}
						</div>
						<Link to="/" className={styles.navCta}>{t('softinsaSite.nav.aceder')}</Link>
					</div>
				</div>
			</header>

			<main id="top">
				{/* Hero */}
				<section className={styles.hero}>
					<div className={styles.heroInner}>
						<div className={styles.heroText}>
							<span className={styles.eyebrow}>{t('softinsaSite.hero.eyebrow')}</span>
							<h1 className={styles.heroTitle}>{t('softinsaSite.hero.title')}</h1>
							<p className={styles.heroSubtitle}>{t('softinsaSite.hero.subtitle')}</p>
							<div className={styles.heroActions}>
								<Link to="/" className={styles.btnPrimary}>{t('softinsaSite.hero.entrar')}</Link>
								<a href="#sobre" className={styles.btnGhost}>{t('softinsaSite.hero.saberMais')}</a>
							</div>
						</div>
						<div className={styles.heroVisual}>
							<img src={HERO_IMG} alt="" loading="lazy" />
							<div className={styles.heroBadge}>
								<span className={styles.heroBadgeIcon}>🏅</span>
								<div>
									<strong>OutSystems · Nível D</strong>
									<span>{t('softinsaSite.hero.credential')}</span>
								</div>
							</div>
						</div>
					</div>
					<div className={styles.heroGlow} aria-hidden="true" />
				</section>

				{/* Stats strip */}
				<section className={`${styles.statsStrip} ${styles.reveal}`}>
					<div><strong>1</strong><span>{t('softinsaSite.stats.learningPaths')}</span></div>
					<div><strong>5</strong><span>{t('softinsaSite.stats.niveis')}</span></div>
					<div><strong>3</strong><span>{t('softinsaSite.stats.idiomas')}</span></div>
					<div><strong>100%</strong><span>{t('softinsaSite.stats.verificaveis')}</span></div>
				</section>

				{/* Sobre */}
				<section id="sobre" className={styles.section}>
					<div className={styles.about}>
						<div className={`${styles.aboutText} ${styles.reveal}`}>
							<h2>{t('softinsaSite.about.title')}</h2>
							<p>{t('softinsaSite.about.p1')}</p>
							<p>{t('softinsaSite.about.p2')}</p>
						</div>
						<div className={`${styles.aboutImg} ${styles.reveal}`}>
							<img src={ABOUT_IMG} alt="" loading="lazy" />
						</div>
					</div>
				</section>

				{/* Funcionalidades — carousel */}
				<section id="funcionalidades" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>{t('softinsaSite.features.title')}</h2></div>
					<div className={styles.marquee}>
						<div className={styles.marqueeTrack}>
							{[...arr(features), ...arr(features)].map((f, i) => (
								<article key={i} className={styles.featCard} aria-hidden={i >= arr(features).length}>
									<span className={styles.cardIcon} aria-hidden="true">{FEATURE_ICONS[i % FEATURE_ICONS.length]}</span>
									<h3>{f.title}</h3>
									<p>{f.desc}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* Badges */}
				<section id="badges" className={styles.section}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}>
						<h2>{t('softinsaSite.badges.title')}</h2>
						<p>{t('softinsaSite.badges.subtitle')}</p>
					</div>
					{badges.length > 0 ? (
						<div className={styles.badgeGrid}>
							{badges.map((b) => (
								<Link key={b.badge_slug} to={`/softinsa/badges/${b.badge_slug}`} className={`${styles.badgeCard} ${styles.reveal}`}>
									<div className={styles.badgeThumb}>
										{b.badge_img_url ? <img src={b.badge_img_url} alt="" loading="lazy" /> : <span className={styles.badgeEmoji}>🏅</span>}
										{b.stage?.code && <span className={styles.badgeLevel}>{b.stage.code}</span>}
									</div>
									<h3>{b.badge_title}</h3>
									<span className={styles.badgeArea}>{b.area?.name || b.service_line?.name || ''}</span>
								</Link>
							))}
						</div>
					) : (
						<p className={styles.muted}>{t('softinsaSite.badges.empty')}</p>
					)}
				</section>

				{/* Perfis */}
				<section id="perfis" className={styles.section}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>{t('softinsaSite.profiles.title')}</h2></div>
					<div className={styles.profiles}>
						{arr(profiles).map((p, i) => (
							<article key={p.title} className={`${styles.profileCard} ${styles.reveal}`} style={{ transitionDelay: `${i * 60}ms` }}>
								<h3>{p.title}</h3>
								<p>{p.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* Fluxo */}
				<section id="fluxo" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>{t('softinsaSite.flow.title')}</h2></div>
					<div className={styles.steps}>
						{arr(steps).map((s, i) => (
							<article key={i} className={`${styles.step} ${styles.reveal}`} style={{ transitionDelay: `${i * 60}ms` }}>
								<span className={styles.stepNum}>{STEP_NUMS[i] || `0${i + 1}`}</span>
								<h3>{s.title}</h3>
								<p>{s.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* CTA */}
				<section className={`${styles.cta} ${styles.reveal}`}>
					<h2>{t('softinsaSite.cta.title')}</h2>
					<p>{t('softinsaSite.cta.subtitle')}</p>
					<Link to="/" className={styles.btnPrimary}>{t('softinsaSite.cta.button')}</Link>
				</section>
			</main>

			{/* Footer */}
			<footer className={styles.footer}>
				<div className={styles.footerTop}>
					<div className={styles.footerMain}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.footerLogo} />
						<p className={styles.footerTagline}>{t('softinsaSite.footer.tagline')}</p>
						<div className={styles.footerContacts}>
							<div>
								<h4>{t('softinsaSite.footer.contacteNos')}</h4>
								<a href="mailto:geral@pt.softinsa.com">
									<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
									geral@pt.softinsa.com
								</a>
								<a href="tel:+351213219600">
									<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" /></svg>
									+351 213 219 600
								</a>
							</div>
							<div>
								<h4>{t('softinsaSite.footer.localizacao')}</h4>
								<address>Edifício Office Oriente<br />Rua do Mar da China nº 3 | B6<br />Parque das Nações<br />1990-138 Lisboa</address>
							</div>
						</div>
					</div>

					<div className={styles.footerTalk}>
						<h3>{t('softinsaSite.footer.vamosConversar')}</h3>
						<p>{t('softinsaSite.footer.envie')}</p>
						<a className={styles.footerFormBtn} href="https://softinsa.pt/contactos/" target="_blank" rel="noreferrer">
							{t('softinsaSite.footer.formulario')} <span aria-hidden="true">↗</span>
						</a>
					</div>

					<div className={styles.footerLinks}>
						<h3>{t('softinsaSite.footer.ligacoesUteis')}</h3>
						<ul>
							{arr(links).map((l) => (
								<li key={l.label || l}><a href={l.url || 'https://softinsa.pt'} target="_blank" rel="noreferrer">{l.label || l}</a></li>
							))}
						</ul>
					</div>
				</div>

				<div className={styles.footerBottom}>
					<div className={styles.socials}>
						<Social label="Facebook"><path d="M14 9h3l.5-3H14V4.5c0-.9.3-1.5 1.6-1.5H18V.3C17.6.2 16.4 0 15.1 0 12.4 0 10.5 1.6 10.5 4.2V6H8v3h2.5v9H14z" /></Social>
						<Social label="Instagram"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 12 18.6 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 12 7.7a4.3 4.3 0 0 1 0 8.6zm6.8-11.2a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" /></Social>
						<Social label="LinkedIn"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.5 8h4V24h-4zM8 8h3.8v2.2h.1c.5-1 1.8-2.2 3.8-2.2 4 0 4.8 2.6 4.8 6.1V24h-4v-7c0-1.7 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7V24H8z" /></Social>
						<Social label="YouTube"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.5zM9.6 15.5v-7l6.2 3.5z" /></Social>
					</div>
					<span className={styles.ibm}>AN <strong>IBM</strong> SUBSIDIARY</span>
					<span className={styles.copyright}>{t('softinsaSite.footer.copyright', { year: new Date().getFullYear() })}</span>
					<div className={styles.policies}>
						{arr(policies).map((p) => (
							<a key={p.label || p} href={p.url || 'https://softinsa.pt'} target="_blank" rel="noreferrer">{p.label || p}</a>
						))}
					</div>
				</div>

				<button type="button" className={styles.toTop} onClick={scrollTop} aria-label={t('softinsaSite.footer.toTop')}>↑</button>
			</footer>
		</div>
	);
}
