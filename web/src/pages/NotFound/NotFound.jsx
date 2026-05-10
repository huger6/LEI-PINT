import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
			<h1 className="display-1 fw-bold text-muted">404</h1>
			<h2 className="h4 mb-3">{t('notFound.title')}</h2>
			<p className="text-muted mb-4">
				{t('notFound.description')}
			</p>
			<Link to="/" className="btn btn-primary">
				{t('notFound.backHome')}
			</Link>
		</div>
	);
}
