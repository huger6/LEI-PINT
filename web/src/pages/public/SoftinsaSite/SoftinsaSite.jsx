import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './SoftinsaSite.module.css';

// Official Softinsa logo (same asset used in the app navbar).
const LOGO_SRC = 'https://cstkpxvilglcavmerctj.supabase.co/storage/v1/object/public/public-assets/structure/logo-softinsa-no-bg.svg';
const HERO_IMG = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80';
const ABOUT_IMG = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80';

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

const LIGACOES = ['Quem somos', 'Responsabilidade Social', 'Serviços', 'Centros de Inovação', 'Carreiras', 'Destaques', 'Contactos'];
const POLICIES = ['Política de Privacidade', 'Condições de Utilização', 'Política Ambiental', 'Canal de Denúncias'];

const Social = ({ label, children, href = 'https://softinsa.pt' }) => (
	<a className={styles.social} href={href} target="_blank" rel="noreferrer" aria-label={label}>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">{children}</svg>
	</a>
);

export default function SoftinsaSite() {
	const rootRef = useRef(null);

	useEffect(() => {
		const prev = document.title;
		document.title = 'Plataforma de Badges - Softinsa';
		return () => { document.title = prev; };
	}, []);

	// Scroll-reveal animations.
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
				if (e.isIntersecting) {
					e.target.classList.add(styles.revealVisible);
					io.unobserve(e.target);
				}
			});
		}, { threshold: 0.12 });
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, []);

	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

	return (
		<div className={styles.site} ref={rootRef}>
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
						<div className={styles.heroText}>
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
						<div className={styles.heroVisual}>
							<img src={HERO_IMG} alt="" loading="lazy" />
							<div className={styles.heroBadge}>
								<span className={styles.heroBadgeIcon}>🏅</span>
								<div>
									<strong>OutSystems · Nível D</strong>
									<span>Credencial verificada</span>
								</div>
							</div>
						</div>
					</div>
					<div className={styles.heroGlow} aria-hidden="true" />
				</section>

				{/* Stats strip */}
				<section className={`${styles.statsStrip} ${styles.reveal}`}>
					<div><strong>1</strong><span>Learning Path inicial</span></div>
					<div><strong>5</strong><span>Níveis por área</span></div>
					<div><strong>3</strong><span>Idiomas</span></div>
					<div><strong>100%</strong><span>Credenciais verificáveis</span></div>
				</section>

				{/* Sobre */}
				<section id="sobre" className={styles.section}>
					<div className={styles.about}>
						<div className={`${styles.aboutText} ${styles.reveal}`}>
							<h2>Sobre o projeto</h2>
							<p>
								A Plataforma de Badges da Softinsa é um sistema de gestão de credenciais digitais que
								reconhece e valida as competências tecnológicas dos consultores através de badges associados
								a Learning Paths, Service Lines e Áreas.
							</p>
							<p>
								Colmata a dificuldade em evidenciar competências, introduz uma camada de gamificação que
								motiva a aprendizagem contínua e cria uma forma padronizada e verificável de apresentar
								credenciais profissionais.
							</p>
						</div>
						<div className={`${styles.aboutImg} ${styles.reveal}`}>
							<img src={ABOUT_IMG} alt="" loading="lazy" />
						</div>
					</div>
				</section>

				{/* Funcionalidades — auto-scrolling carousel */}
				<section id="funcionalidades" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>Funcionalidades</h2></div>
					<div className={styles.marquee}>
						<div className={styles.marqueeTrack}>
							{[...FEATURES, ...FEATURES].map((f, i) => (
								<article key={i} className={styles.featCard} aria-hidden={i >= FEATURES.length}>
									<span className={styles.cardIcon} aria-hidden="true">{f.icon}</span>
									<h3>{f.title}</h3>
									<p>{f.desc}</p>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* Perfis */}
				<section id="perfis" className={styles.section}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>Perfis de utilizador</h2></div>
					<div className={styles.profiles}>
						{PROFILES.map((p, i) => (
							<article key={p.title} className={`${styles.profileCard} ${styles.reveal}`} style={{ transitionDelay: `${i * 60}ms` }}>
								<h3>{p.title}</h3>
								<p>{p.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* Fluxo */}
				<section id="fluxo" className={`${styles.section} ${styles.sectionAlt}`}>
					<div className={`${styles.sectionHead} ${styles.reveal}`}><h2>Como funciona</h2></div>
					<div className={styles.steps}>
						{STEPS.map((s, i) => (
							<article key={s.n} className={`${styles.step} ${styles.reveal}`} style={{ transitionDelay: `${i * 60}ms` }}>
								<span className={styles.stepNum}>{s.n}</span>
								<h3>{s.title}</h3>
								<p>{s.desc}</p>
							</article>
						))}
					</div>
				</section>

				{/* CTA */}
				<section className={`${styles.cta} ${styles.reveal}`}>
					<h2>Pronto para evidenciar as suas competências?</h2>
					<p>Aceda à plataforma e comece a conquistar os seus badges.</p>
					<Link to="/" className={styles.btnPrimary}>Aceder à Plataforma</Link>
				</section>
			</main>

			{/* Footer (styled after softinsa.pt) */}
			<footer className={styles.footer}>
				<div className={styles.footerTop}>
					<div className={styles.footerMain}>
						<img src={LOGO_SRC} alt="Softinsa" className={styles.footerLogo} />
						<p className={styles.footerTagline}>
							Fale com a equipa Softinsa e descubra como podemos impulsionar a inovação no seu negócio.
						</p>
						<div className={styles.footerContacts}>
							<div>
								<h4>Contacte-nos</h4>
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
								<h4>Localização</h4>
								<address>
									Edifício Office Oriente<br />
									Rua do Mar da China nº 3 | B6<br />
									Parque das Nações<br />
									1990-138 Lisboa
								</address>
							</div>
						</div>
					</div>

					<div className={styles.footerTalk}>
						<h3>Vamos Conversar?</h3>
						<p>Envie aqui a sua mensagem.</p>
						<a className={styles.footerFormBtn} href="https://softinsa.pt/contactos/" target="_blank" rel="noreferrer">
							Formulário <span aria-hidden="true">↗</span>
						</a>
					</div>

					<div className={styles.footerLinks}>
						<h3>Ligações Úteis</h3>
						<ul>
							{LIGACOES.map((l) => (
								<li key={l}><a href="https://softinsa.pt" target="_blank" rel="noreferrer">{l}</a></li>
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
					<span className={styles.copyright}>© Softinsa {new Date().getFullYear()}. Todos os direitos reservados.</span>
					<div className={styles.policies}>
						{POLICIES.map((p) => (
							<a key={p} href="https://softinsa.pt" target="_blank" rel="noreferrer">{p}</a>
						))}
					</div>
				</div>

				<button type="button" className={styles.toTop} onClick={scrollTop} aria-label="Voltar ao topo">↑</button>
			</footer>
		</div>
	);
}
