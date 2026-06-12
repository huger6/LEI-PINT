import styles from './Spinner.module.css';

export default function Spinner({ size = 'md', className = '' }) {
	const sizeClass = styles[size] || styles.md;
	return (
		<div className={`d-flex align-items-center justify-content-center py-5 ${className}`}>
			<div className={`spinner-border ${styles.spinner} ${sizeClass}`} role="status" />
		</div>
	);
}
