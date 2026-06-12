import { useCallback, useMemo, useState } from 'react';

export function useFormValidation({ initialValues, validate }) {
	const [values, setValues] = useState(initialValues);
	const [touched, setTouched] = useState({});
	const [submitAttempted, setSubmitAttempted] = useState(false);

	const errors = useMemo(
		() => (typeof validate === 'function' ? validate(values) || {} : {}),
		[validate, values]
	);

	const setFieldValue = useCallback((name, value) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	}, []);

	const setFieldTouched = useCallback((name, value = true) => {
		setTouched((prev) => ({ ...prev, [name]: value }));
	}, []);

	const handleChange = useCallback((e) => {
		const { name, value, type, checked } = e.target;
		setFieldValue(name, type === 'checkbox' ? checked : value);
	}, [setFieldValue]);

	const handleBlur = useCallback((e) => {
		setFieldTouched(e.target.name, true);
	}, [setFieldTouched]);

	const isErrorVisible = useCallback(
		(name) => Boolean((touched[name] || submitAttempted) && errors[name]),
		[touched, submitAttempted, errors]
	);

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

	const getCheckboxProps = useCallback(
		(name) => ({
			name,
			checked: Boolean(values[name]),
			onChange: handleChange,
		}),
		[values, handleChange]
	);

	const markAllTouched = useCallback(() => {
		setSubmitAttempted(true);
		setTouched((prev) => {
			const next = { ...prev };
			for (const key of Object.keys(values)) next[key] = true;
			return next;
		});
	}, [values]);

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

export const mergeError = (...messages) => {
	for (const m of messages) {
		if (m) return m;
	}
	return undefined;
};
