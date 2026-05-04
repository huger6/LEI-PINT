import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
	return (
		<div className="d-flex align-items-center justify-content-center min-vh-100">
			<div className={`spinner-border ${styles.spinner}`} role="status" aria-label="Loading…" />
		</div>
	);
}
