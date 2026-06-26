import styles from './Button.module.css';

/**
 * Reusable button with variant, color, size, and loading state support.
 * @param {'filled'|'outlined'|'text'} [variant='filled'] - Visual style.
 * @param {'primary'|'secondary'|'danger'} [color='primary'] - Color theme.
 * @param {'sm'|'md'|'lg'} [size='md'] - Size preset.
 * @param {boolean} [loading=false] - Shows spinner and disables interaction.
 * @param {string|Component} [as='button'] - Polymorphic root element (e.g. 'a' for links).
 */
export default function Button({
	children,
	variant = 'filled',
	color = 'primary',
	size = 'md',
	fullWidth = false,
	loading = false,
	disabled = false,
	type = 'button',
	onClick,
	className = '',
	as: Tag = 'button',
	...rest
}) {
	const classes = [
		styles.btn,
		styles[variant],
		styles[color],
		styles[size],
		fullWidth ? styles.fullWidth : '',
		className,
	].filter(Boolean).join(' ');

	const isNativeButton = Tag === 'button';

	return (
		<Tag
			{...(isNativeButton ? { type, disabled: disabled || loading } : {})}
			onClick={onClick}
			className={classes}
			{...rest}
		>
			{loading && <span className={styles.spinner} aria-hidden="true" />}
			<span className={`${styles.content}${loading ? ` ${styles.hidden}` : ''}`}>{children}</span>
		</Tag>
	);
}
