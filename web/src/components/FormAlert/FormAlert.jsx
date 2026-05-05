const VARIANT_CLASS = {
	danger: 'alert-danger',
	warning: 'alert-warning',
	info: 'alert-info',
};

export default function FormAlert({ message, variant = 'danger', className = '' }) {
	if (!message) return null;

	return (
		<div className={`alert ${VARIANT_CLASS[variant] || VARIANT_CLASS.danger} py-2 px-3 mb-0 small ${className}`} role="alert">
			{message}
		</div>
	);
}
