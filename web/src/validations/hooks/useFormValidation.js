// Generic form validation hook with touched-field tracking and error visibility control.
import { useCallback, useMemo, useState } from 'react';

/**
 * Manages form state, validation, and field-level error visibility.
 * @param {Object} initialValues - Initial form values.
 * @param {Function} validate - Function that returns an errors object from current values.
 */
// Manages form field values, touched state, validation errors, and submission tracking.
export function useFormValidation({ initialValues, validate }) {
	// Stores the current value of every form field.
	const [values, setValues] = useState(initialValues);
	// Tracks which fields the user has interacted with (blurred or changed).
	const [touched, setTouched] = useState({});
	// Becomes true after the first submit attempt to show all field errors at once.
	const [submitAttempted, setSubmitAttempted] = useState(false);

	// Recomputes the full errors map whenever values or the validate function changes.
	const errors = useMemo(
		() => (typeof validate === 'function' ? validate(values) || {} : {}),
		[validate, values]
	);

	// Sets a single field's value by name without affecting other fields.
	const setFieldValue = useCallback((name, value) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	// Marks a single field as touched (or untouched) by name.
	const setFieldTouched = useCallback((name, value = true) => {
		setTouched((prev) => ({ ...prev, [name]: value }));
	}, []);

	// Updates the corresponding field's value when an input's change event fires.
	const handleChange = useCallback((e) => {
		const { name, value, type, checked } = e.target;
		setFieldValue(name, type === 'checkbox' ? checked : value);
	}, [setFieldValue]);

	// Marks the field as touched when an input loses focus.
	const handleBlur = useCallback((e) => {
		setFieldTouched(e.target.name, true);
	}, [setFieldTouched]);

	// Returns true when a field's error should be displayed to the user.
	const isErrorVisible = useCallback(
		(name) => Boolean((touched[name] || submitAttempted) && errors[name]),
		[touched, submitAttempted, errors]
	);

	// Returns { name, value, onChange, onBlur, error } ready to spread onto an input element.
	const getFieldProps = useCallback(
		(name) => ({
			name,
			value: values[name] ?? '',
			onChange: handleChange,
			onBlur: handleBlur,
			error: isErrorVisible(name) ? errors[name] : undefined,
		}),
		[values, handleChange, handleBlur, isErrorVisible, errors]
	);

	// Returns { name, checked, onChange } props suitable for a checkbox input.
	const getCheckboxProps = useCallback(
		(name) => ({
			name,
			checked: Boolean(values[name]),
			onChange: handleChange,
		}),
		[values, handleChange]
	);

	// Flags all fields as touched and sets submitAttempted so all errors become visible.
	const markAllTouched = useCallback(() => {
		setSubmitAttempted(true);
		setTouched((prev) => {
			const next = { ...prev };
			for (const key of Object.keys(values)) next[key] = true;
			return next;
		});
	}, [values]);

	// Resets form values, touched state, and submitAttempted to their initial state.
	const resetForm = useCallback((next = initialValues) => {
		setValues(next);
		setTouched({});
		setSubmitAttempted(false);
	}, [initialValues]);

	return {
		values,
		setValues,
		setFieldValue,
		touched,
		setFieldTouched,
		submitAttempted,
		errors,
		isErrorVisible,
		handleChange,
		handleBlur,
		getFieldProps,
		getCheckboxProps,
		markAllTouched,
		resetForm,
	};
}

/** Returns the first truthy error message from the arguments. */
export const mergeError = (...messages) => {
	for (const m of messages) {
		if (m) return m;
	}
	return undefined;
};
