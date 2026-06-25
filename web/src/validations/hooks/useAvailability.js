// Debounced availability check hook (e.g. username/email uniqueness) with status tracking.
import { useEffect, useRef, useState } from 'react';

export const AVAILABILITY_STATUS = Object.freeze({
	IDLE: 'idle',
	CHECKING: 'checking',
	AVAILABLE: 'available',
	UNAVAILABLE: 'unavailable',
	ERROR: 'error',
});

/**
 * Debounces an async availability check and tracks its status.
 * @param {string} value - The value to check (e.g. username).
 * @param {boolean} isValid - Whether client-side validation passes (skips check if false).
 * @param {boolean} enabled - Master toggle to enable/disable checking.
 * @param {Function} fetcher - Async function that checks availability. Must return { available: boolean }.
 * @param {number} delay - Debounce delay in ms (default 500).
 */
// Debounces and runs an async availability check, returning its status and result.
export function useAvailability({
	value,
	isValid = true,
	enabled = true,
	fetcher,
	delay = 500,
}) {
	// Tracks the current availability check status (idle, checking, available, etc.).
	const [status, setStatus] = useState(AVAILABILITY_STATUS.IDLE);
	// Stores the raw result data returned by the fetcher function.
	const [result, setResult] = useState(null);
	// Monotonically incremented counter used to ignore stale async responses.
	const requestId = useRef(0);

	// Debounces the availability check and updates status/result when the value or config changes.
	useEffect(() => {
		if (!enabled || !value || !isValid || typeof fetcher !== 'function') {
			setStatus(AVAILABILITY_STATUS.IDLE);
			setResult(null);
			return undefined;
		}

		setStatus(AVAILABILITY_STATUS.CHECKING);
		const id = ++requestId.current;
		const handle = setTimeout(async () => {
			try {
				const data = await fetcher(value);
				if (id !== requestId.current) return;
				setResult(data);
				setStatus(
					data?.available
						? AVAILABILITY_STATUS.AVAILABLE
						: AVAILABILITY_STATUS.UNAVAILABLE
				);
			} catch {
				if (id !== requestId.current) return;
				setStatus(AVAILABILITY_STATUS.ERROR);
				setResult(null);
			}
		}, delay);

		return () => clearTimeout(handle);
	}, [value, isValid, enabled, delay, fetcher]);

	return { status, result };
}

// Returns true when the availability check is in-flight.
export const isCheckPending = (status) =>
	status === AVAILABILITY_STATUS.CHECKING;

// Returns true when the availability check result should block form submission.
export const isCheckBlocking = (status) =>
	status === AVAILABILITY_STATUS.UNAVAILABLE ||
	status === AVAILABILITY_STATUS.CHECKING;
