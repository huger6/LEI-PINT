// Extends useFormValidation with server-side error handling for API form submissions.
import { useState, useCallback } from 'react';
import { useFormValidation } from '../validations';

/**
 * Wraps useFormValidation and adds server-side field error tracking.
 * @param {Object} initialValues - Initial form field values.
 * @param {Function} validate - Client-side validation function.
 */
// Extends useFormValidation with server-side field error state and a general error message.
export function useFormWithServerErrors({ initialValues, validate }) {
	// Initializes the base form validation state, handlers, and helpers.
	const form = useFormValidation({ initialValues, validate });
	// Stores field-level error messages returned from the server.
	const [serverFieldErrors, setServerFieldErrors] = useState({});
	// Stores a general (non-field-specific) error message from the server.
	const [error, setError] = useState('');

	// Returns the client or server error for a given field, preferring client-side errors.
	const fieldError = useCallback(
		(name) => form.getFieldProps(name).error ?? serverFieldErrors[name],
		[form, serverFieldErrors]
	);

	// Handles input changes by delegating to the base form and clearing server errors for the field.
	const onChange = useCallback(
		(e) => {
			form.handleChange(e);
			setServerFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
			setError('');
		},
		[form]
	);

	// Clears all server-side field errors and the general error message.
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
