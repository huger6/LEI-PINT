import { Component } from 'react';
import PropTypes from 'prop-types';
import i18n from '../../i18n';
import Button from '../Button/Button';
import AuthLayout from '../../features/auth/layouts/AuthLayout/AuthLayout';
import AuthCard from '../../features/auth/components/AuthCard/AuthCard';
import { UserContext } from '../../context/UserContext';
import { ADMIN, SHARED } from '../../routes/paths';
import styles from '../../pages/shared/ErrorCodePage/ErrorCodePage.module.css';

/** React error boundary that catches render errors and displays a recovery page. */
export default class ErrorBoundary extends Component {
	static contextType = UserContext;

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

	getDashboardPath() {
		const role = this.context?.user?.role;
		if (role === 'Administrator') return ADMIN.DASHBOARD;
		return SHARED.HOME;
	}

	render() {
		if (this.state.hasError) {
			const t = i18n.t.bind(i18n);
			const dashboardPath = this.getDashboardPath();

			return (
				<AuthLayout>
					<AuthCard>
						<div className="d-flex flex-column align-items-center gap-3 py-2 text-center">
							<h1 className={styles.errorCode}>
								{t('errorBoundary.title')}
							</h1>
							<h2 className={styles.title}>
								{t('errorBoundary.subtitle')}
							</h2>
							<p className={styles.description}>
								{t('errorBoundary.description')}
							</p>
							<Button onClick={() => globalThis.location.assign(dashboardPath)}>
								{t('errorBoundary.reload')}
							</Button>
						</div>
					</AuthCard>
				</AuthLayout>
			);
		}

		return this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
};
