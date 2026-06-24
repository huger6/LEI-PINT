import styles from './Spinner.module.css';

/**
 * Centered loading spinner using Bootstrap's spinner-border.
 * @param {'sm'|'md'|'lg'} [size='md'] - Spinner size.
 */
export default function Spinner({ size = 'md', className = '' }) {
	const sizeClass = styles[size] || styles.md;
	return (
		<div className={`d-flex align-items-center justify-content-center py-5 ${className}`}>
			<div className={`spinner-border ${styles.spinner} ${sizeClass}`} role="status" />
		</div>
	);
}
