import styles from './FormInput.module.css';

export default function FormInput({ id, label, error, className, ...inputProps }) {
	return (
		<div className={className ?? ''}>
			{label && (
				<label htmlFor={id} className={`form-label ${styles.label}`}>
					{label}
				</label>
			)}
			<input
				id={id}
				className={`form-control ${styles.input} ${error ? `is-invalid ${styles.inputError}` : ''}`}
				{...inputProps}
			/>
			{error && (
				<div className={`invalid-feedback ${styles.errorText}`} role="alert">
					{error}
				</div>
			)}
		</div>
	);
}
