import styles from './Button.module.css';

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
			<span className={loading ? styles.hidden : undefined}>{children}</span>
		</Tag>
	);
}
