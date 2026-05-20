import styles from './Skeleton.module.css';

export default function Skeleton({
	width,
	height,
	borderRadius,
	circle = false,
	className = '',
	style = {},
}) {
	return (
		<div
			className={`${styles.bone} ${circle ? styles.circle : ''} ${className}`}
			style={{
				width: width ?? '100%',
				height: height ?? 16,
				borderRadius: circle ? '50%' : (borderRadius ?? undefined),
				...style,
			}}
			aria-hidden="true"
		/>
	);
}
