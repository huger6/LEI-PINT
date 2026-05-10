import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
			<div
				style={{
					width: 80, height: 80, borderRadius: 20, marginBottom: 24,
					background: 'linear-gradient(135deg, rgba(0,184,224,0.1) 0%, rgba(57,99,156,0.1) 100%)',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
				}}
			>
				<i className="bi bi-compass" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }} />
			</div>
			<h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-outline)', opacity: 0.4 }}>404</h1>
			<h2 className="mt-1 mb-2" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Página não encontrada</h2>
			<p className="text-muted mb-4" style={{ fontSize: '0.9375rem', maxWidth: 380 }}>
				A página que procura não existe ou foi movida.
			</p>
			<Link
				to="/"
				className="btn btn-primary"
				style={{ borderRadius: 10, fontWeight: 600, padding: '8px 24px' }}
			>
				<i className="bi bi-house me-2" />
				Voltar ao Início
			</Link>
		</div>
	);
}
