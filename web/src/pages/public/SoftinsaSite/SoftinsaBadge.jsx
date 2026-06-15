import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicBadge } from '../../../features/badges/api/publicBadgesApi';
import styles from './SoftinsaBadge.module.css';

const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

export default function SoftinsaBadge() {
	const { slug } = useParams();
	const [badge, setBadge] = useState(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		getPublicBadge(slug)
			.then((b) => { if (active) { if (b) setBadge(b); else setNotFound(true); } })
			.catch(() => { if (active) setNotFound(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [slug]);

	useEffect(() => {
		const prev = document.title;
		if (badge) document.title = `${badge.badge_title} - Softinsa`;
		return () => { document.title = prev; };
	}, [badge]);

	const meta = badge ? [
		badge.stage && { label: 'Nível', value: `${badge.stage.code ? `${badge.stage.code} · ` : ''}${badge.stage.title || ''}` },
		badge.area && { label: 'Área', value: badge.area.name },
		badge.service_line && { label: 'Service Line', value: badge.service_line.name },
		badge.learning_path && { label: 'Learning Path', value: badge.learning_path.title },
	].filter(Boolean) : [];

	return (
		<div className={styles.site}>
			<header className={styles.nav}>
				<div className={styles.navInner}>
					<Link to="/softinsa" className={styles.brand}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.logoImg} />
					</Link>
					<Link to="/softinsa#badges" className={styles.back}>← Todos os badges</Link>
				</div>
			</header>

			<main className={styles.main}>
				{loading ? (
					<p className={styles.state}>A carregar…</p>
				) : notFound || !badge ? (
					<div className={styles.state}>
						<h1>Badge não encontrado</h1>
						<Link to="/softinsa#badges" className={styles.btn}>Ver todos os badges</Link>
					</div>
				) : (
					<>
						<section className={styles.hero}>
							<div className={styles.heroImg}>
								{badge.badge_img_url ? <img src={badge.badge_img_url} alt={badge.badge_title} /> : <span>🏅</span>}
							</div>
							<div className={styles.heroInfo}>
								{badge.badge_type === 'Special' && <span className={styles.premium}>Premium</span>}
								<h1>{badge.badge_title}</h1>
								<p className={styles.desc}>{badge.badge_description}</p>
								<div className={styles.metaRow}>
									{meta.map((m) => (
										<div key={m.label} className={styles.metaItem}>
											<span className={styles.metaLabel}>{m.label}</span>
											<span className={styles.metaValue}>{m.value}</span>
										</div>
									))}
									<div className={styles.metaItem}>
										<span className={styles.metaLabel}>Pontos</span>
										<span className={styles.metaValue}>{badge.badge_points ?? 0}</span>
									</div>
									{badge.expiration_duration_days != null && (
										<div className={styles.metaItem}>
											<span className={styles.metaLabel}>Validade</span>
											<span className={styles.metaValue}>{badge.expiration_duration_days} dias</span>
										</div>
									)}
								</div>
							</div>
						</section>

						<section className={styles.section}>
							<h2>Competências</h2>
							<p className={styles.sectionSub}>O que é necessário evidenciar para obter este badge.</p>
							{badge.requirements?.length > 0 ? (
								<div className={styles.reqGrid}>
									{badge.requirements.map((r, i) => (
										<article key={i} className={styles.reqCard}>
											<span className={styles.reqNum}>{String(i + 1).padStart(2, '0')}</span>
											<h3>{r.title}</h3>
											{r.description && <p>{r.description}</p>}
										</article>
									))}
								</div>
							) : (
								<p className={styles.muted}>Sem competências detalhadas para este badge.</p>
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
