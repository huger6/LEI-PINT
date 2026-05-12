import { Component } from 'react';
import PropTypes from 'prop-types';
import i18n from '../../i18n';
import Button from '../Button/Button';

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
			const t = i18n.t.bind(i18n);

			return (
				<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
					<h1 className="display-1 fw-bold text-danger">{t('errorBoundary.title')}</h1>
					<h2 className="h4 mb-3">{t('errorBoundary.subtitle')}</h2>
					<p className="text-muted mb-4">
						{t('errorBoundary.description')}
					</p>
					<Button onClick={() => globalThis.location.reload()}>
						{t('errorBoundary.reload')}
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
};
