import styles from './FormButton.module.css';

/**
 * Full-width form submit button with loading spinner.
 * @param {'primary'|'secondary'} [variant='primary'] - Color variant.
 * @param {boolean} [loading=false] - Shows spinner and disables the button.
 */
export default function FormButton({
	children,
	variant = 'primary',
	loading = false,
	disabled = false,
	type = 'button',
	onClick,
	className,
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			className={`btn w-100 d-flex align-items-center justify-content-center position-relative ${styles[variant]} ${className ?? ''}`}
		>
			{loading && <span className={styles.spinner} aria-hidden="true" />}
			<span className={loading ? 'invisible' : ''}>{children}</span>
		</button>
	);
}
