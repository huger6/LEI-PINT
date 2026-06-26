import { useEffect, useRef } from 'react';
import { useUser } from '../../../hooks/userContext';

/**
 * Runs `handler` whenever a NEW real-time notification arrives over the socket.
 *
 * This is the bridge that lets any page stay live without polling or manual
 * reloads: the UserContext socket listener stores each incoming notification,
 * and this hook fires the page's callback (typically a re-fetch) when one of
 * the given type(s) shows up.
 *
 * @param {string|string[]|null} type  Notification type(s) to react to (e.g.
 *   'APPLICATIONS'). Pass null/undefined to react to every notification.
 * @param {(notification: object) => void} handler  Called with the raw event.
 */
export function useNotificationEvent(type, handler) {
	const { notifications } = useUser();
	const last = notifications?.last;

	// Keep the latest handler without making it a dependency, so callers can
	// pass an inline arrow function without re-subscribing on every render.
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	// Remember which event we have already processed. Initialised to whatever is
	// current at mount so we never fire for a stale notification on first render.
	const seenRef = useRef(last);

	useEffect(() => {
		if (last === seenRef.current) return;
		seenRef.current = last;
		if (!last) return;

		const eventType = String(last.notification_type || last.type || '').toUpperCase();
		const wanted = type == null
			? null
			: (Array.isArray(type) ? type : [type]).map((x) => String(x).toUpperCase());

		if (wanted && !wanted.includes(eventType)) return;
		handlerRef.current(last);
	}, [last, type]);
}
