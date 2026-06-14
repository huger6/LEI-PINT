import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './SoftinsaSite.module.css';

// Official Softinsa logo (same asset used in the app navbar).
const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';

// Public corporate microsite about the project, styled like softinsa.pt and
// intentionally independent from the application theme. Route: /softinsa
const FEATURES = [
	{ icon: '🎯', title: 'Learning Paths', desc: 'Percursos técnicos organizados por Service Lines, Áreas e níveis de progressão.' },
	{ icon: '🏅', title: 'Credenciais verificáveis', desc: 'Cada badge tem uma página pública única para verificação externa e assinaturas de email.' },
	{ icon: '🎮', title: 'Gamificação', desc: 'Sistema de pontos, conquistas e ranking que incentiva a formação contínua.' },
	{ icon: '✅', title: 'Validação por especialistas', desc: 'Fluxo de validação em duas fases: Talent Manager e Service Line Leader.' },
	{ icon: '📊', title: 'Estatísticas e relatórios', desc: 'KPIs, distribuição de badges e exportações para Excel/PDF.' },
	{ icon: '🌐', title: 'Multilíngue', desc: 'Disponível em Português, Inglês e Espanhol.' },
];

const PROFILES = [
	{ title: 'Consultor', desc: 'Candidata-se a badges, submete evidências, acompanha o progresso e partilha credenciais.' },
	{ title: 'Talent Manager', desc: 'Verifica as evidências de todas as candidaturas, independentemente da Service Line.' },
	{ title: 'Service Line Leader', desc: 'Decisão final sobre as candidaturas da sua Service Line.' },
	{ title: 'Administrador', desc: 'Gere utilizadores, conteúdos, o motor de pontos e as políticas da plataforma.' },
];

const STEPS = [
	{ n: '01', title: 'Candidatura', desc: 'O consultor submete a candidatura a um badge com as evidências necessárias.' },
	{ n: '02', title: 'Verificação', desc: 'O Talent Manager valida as evidências e encaminha para o Service Line Leader.' },
	{ n: '03', title: 'Decisão', desc: 'O Service Line Leader aprova ou rejeita; o badge é gerado e fica disponível.' },
	{ n: '04', title: 'Partilha', desc: 'O consultor publica e partilha a credencial, com verificação pública por link.' },
];

export default function SoftinsaSite() {
	useEffect(() => {
		const prev = document.title;
		document.title = 'Softinsa — Plataforma de Badges';
		return () => { document.title = prev; };
	}, []);

	return (
		<div className={styles.site}>
			<header className={styles.nav}>
				<div className={styles.navInner}>
					<a href="#top" className={styles.brand}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.logoImg} />
					</a>
					<nav className={styles.navLinks}>
						<a href="#sobre">Sobre</a>
						<a href="#funcionalidades">Funcionalidades</a>
						<a href="#perfis">Perfis</a>
						<a href="#fluxo">Como funciona</a>
					</nav>
					<Link to="/" className={styles.navCta}>Aceder à Plataforma</Link>
				</div>
			</header>

			<main id="top">
				{/* Hero */}
				<section className={styles.hero}>
					<div className={styles.heroInner}>
						<span className={styles.eyebrow}>Softinsa · An IBM Subsidiary</span>
						<h1 className={styles.heroTitle}>Plataforma de Badges</h1>
						<p className={styles.heroSubtitle}>
							Inovação, talento e tecnologia para acelerar a transformação digital — agora também na forma
							como reconhecemos as competências das nossas equipas, com credenciais digitais verificáveis.
						</p>
						<div className={styles.heroActions}>
							<Link to="/" className={styles.btnPrimary}>Entrar</Link>
							<a href="#sobre" className={styles.btnGhost}>Saber mais</a>
						</div>
					</div>
					<div className={styles.heroGlow} aria-hidden="true" />
				</section>

				{/* Stats strip */}
				<section className={styles.statsStrip}>
					<div><strong>1</strong><span>Learning Path inicial</span></div>
					<div><strong>5</strong><span>Níveis por área</span></div>
					<div><strong>3</strong><span>Idiomas</span></div>
					<div><strong>100%</strong><span>Credenciais verificáveis</span></div>
				</section>

				{/* Sobre */}
				<section id="sobre" className={styles.section}>
					<div className={styles.sectionHead}>
						<h2>Sobre o projeto</h2>
						<p>
							A Plataforma de Badges da Softinsa é um sistema de gestão de credenciais digitais, semelhante ao
							Credly, que reconhece e valida as competências tecnológicas dos consultores através de badges
							associados a Learning Paths, Service Lines e Áreas.
						</p>
					</div>
				</section>

				{/* Funcionalidades */}
				<section id="funcionalidades" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={styles.sectionHead}><h2>Funcionalidades</h2></div>
					<div className={styles.grid}>
						{FEATURES.map((f) => (
							<article key={f.title} className={styles.card}>
								<span className={styles.cardIcon} aria-hidden="true">{f.icon}</span>
								<h3>{f.title}</h3>
								<p>{f.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* Perfis */}
				<section id="perfis" className={styles.section}>
					<div className={styles.sectionHead}><h2>Perfis de utilizador</h2></div>
					<div className={styles.profiles}>
						{PROFILES.map((p) => (
							<article key={p.title} className={styles.profileCard}>
								<h3>{p.title}</h3>
								<p>{p.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* Fluxo */}
				<section id="fluxo" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={styles.sectionHead}><h2>Como funciona</h2></div>
					<div className={styles.steps}>
						{STEPS.map((s) => (
							<article key={s.n} className={styles.step}>
								<span className={styles.stepNum}>{s.n}</span>
								<h3>{s.title}</h3>
								<p>{s.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* CTA */}
				<section className={styles.cta}>
					<h2>Pronto para evidenciar as suas competências?</h2>
					<p>Aceda à plataforma e comece a conquistar os seus badges.</p>
					<Link to="/" className={styles.btnPrimary}>Aceder à Plataforma</Link>
				</section>
			</main>

			<footer className={styles.footer}>
				<div className={styles.footerInner}>
					<img src={LOGO_SRC} alt="Softinsa" className={styles.footerLogo} />
					<p>© {new Date().getFullYear()} Softinsa — An IBM Subsidiary. Plataforma de Badges (projeto académico LEI-PINT).</p>
				</div>
			</footer>
		</div>
	);
}
