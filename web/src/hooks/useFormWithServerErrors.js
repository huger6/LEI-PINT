// Extends useFormValidation with server-side error handling for API form submissions.
import { useState, useCallback } from 'react';
import { useFormValidation } from '../validations';

/**
 * Wraps useFormValidation and adds server-side field error tracking.
 * @param {Object} initialValues - Initial form field values.
 * @param {Function} validate - Client-side validation function.
 */
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
