import { useEffect, useRef, useState } from 'react';

export const AVAILABILITY_STATUS = Object.freeze({
	IDLE: 'idle',
	CHECKING: 'checking',
	AVAILABLE: 'available',
	UNAVAILABLE: 'unavailable',
	ERROR: 'error',
});

export function useAvailability({
	value,
	isValid = true,
	enabled = true,
	fetcher,
	delay = 500,
}) {
	const [status, setStatus] = useState(AVAILABILITY_STATUS.IDLE);
	const [result, setResult] = useState(null);
	const requestId = useRef(0);

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

export const isCheckPending = (status) =>
	status === AVAILABILITY_STATUS.CHECKING;

export const isCheckBlocking = (status) =>
	status === AVAILABILITY_STATUS.UNAVAILABLE ||
	status === AVAILABILITY_STATUS.CHECKING;
