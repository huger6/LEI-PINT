import { Component } from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
					<h1 className="display-1 fw-bold text-danger">Oops!</h1>
					<h2 className="h4 mb-3">Algo correu mal</h2>
					<p className="text-muted mb-4">
						Ocorreu um erro inesperado. Por favor, tente recarregar a página.
					</p>
					<button
						className="btn btn-primary"
						onClick={() => globalThis.location.reload()}
					>
						Recarregar Página
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
};
