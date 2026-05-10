import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
			<h1 className="display-1 fw-bold text-muted">404</h1>
			<h2 className="h4 mb-3">Página não encontrada</h2>
			<p className="text-muted mb-4">
				A página que procura não existe ou foi movida.
			</p>
			<Link to="/" className="btn btn-primary">
				Voltar ao Início
			</Link>
		</div>
	);
}
