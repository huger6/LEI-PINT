import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ParticlesBackground from '../../components/ParticlesBackground/ParticlesBackground';

const ERROR_MESSAGES = {
	400: { title: 'Bad Request', description: 'The request could not be understood by the server.' },
	401: { title: 'Unauthorized', description: 'You need to log in to access this page.' },
	403: { title: 'Forbidden', description: 'You do not have permission to view this page.' },
	404: { title: 'Page Not Found', description: 'The page you are looking for does not exist or has been moved.' },
	408: { title: 'Request Timeout', description: 'The server timed out waiting for your request.' },
	429: { title: 'Too Many Requests', description: 'You have made too many requests. Please wait a moment and try again.' },
	500: { title: 'Internal Server Error', description: 'Something went wrong on our end. Please try again later.' },
	502: { title: 'Bad Gateway', description: 'The server received an invalid response. Please try again later.' },
	503: { title: 'Service Unavailable', description: 'The service is temporarily unavailable. Please try again later.' },
	504: { title: 'Gateway Timeout', description: 'The server did not respond in time. Please try again later.' },
};

const DEFAULT_ERROR = {
	title: 'Unexpected Error',
	description: 'An unexpected error occurred. Please try again later.',
};

export default function ErrorPage({ code = 404 }) {
	const { title, description } = ERROR_MESSAGES[code] ?? DEFAULT_ERROR;

	return (
		<div style={{
			minHeight: '100dvh',
			background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-primary-container) 50%, var(--color-secondary-container) 100%)',
			position: 'relative',
		}}>
			<ParticlesBackground />
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100dvh',
				textAlign: 'center',
				padding: '1rem',
				position: 'relative',
				zIndex: 1,
			}}>
				<h1 style={{ fontSize: '6rem', fontWeight: 700, color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1 }}>
					{code}
				</h1>
				<h2 style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.75rem' }}>
					{title}
				</h2>
				<p style={{ color: 'var(--color-on-surface-variant)', marginBottom: '1.5rem', maxWidth: '400px' }}>
					{description}
				</p>
				<Link to="/" className="btn btn-primary">
					Go Back Home
				</Link>
			</div>
		</div>
	);
}
