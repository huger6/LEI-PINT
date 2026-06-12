import { useState, useCallback } from 'react';
import { useFormValidation } from '../validations';

export function useFormWithServerErrors({ initialValues, validate }) {
	const form = useFormValidation({ initialValues, validate });
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	const [error, setError] = useState('');

	const fieldError = useCallback(
		(name) => form.getFieldProps(name).error ?? serverFieldErrors[name],
		[form, serverFieldErrors]
	);

	const onChange = useCallback(
		(e) => {
			form.handleChange(e);
			setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
			setError('');
		},
		[form]
	);

	const clearServerErrors = useCallback(() => {
		setServerFieldErrors({});
		setError('');
	}, []);

	return {
		...form,
		serverFieldErrors,
		setServerFieldErrors,
		error,
		setError,
		fieldError,
		onChange,
		clearServerErrors,
	};
}
