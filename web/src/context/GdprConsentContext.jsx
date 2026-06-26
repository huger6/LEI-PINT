import { createContext, useContext, useCallback, useRef, useState } from 'react';
import GdprConsentModal from '../components/GdprConsentModal/GdprConsentModal';

const GdprConsentContext = createContext(null);

/**
 * Centralises the "make sure the user has accepted the privacy policy before
 * doing X" flow. Any component can call:
 *
 *   const { requestConsent } = useGdprConsent();
 *   const ok = await requestConsent({ purpose: '...' });
 *   if (!ok) return;            // user cancelled
 *   ...proceed with the share...
 *
 * The underlying GdprConsentModal already short-circuits (auto-confirms) when
 * the policy was accepted before, so consent is only ever asked for once.
 */
export function GdprConsentProvider({ children }) {
	// Modal request state: null when closed, otherwise { policyType, purpose }.
	const [request, setRequest] = useState(null);
	// Holds the promise resolver for the in-flight requestConsent() call.
	const resolverRef = useRef(null);

	// Settle the pending promise (if any) and close the modal.
	const settle = useCallback((result) => {
		const resolve = resolverRef.current;
		resolverRef.current = null;
		setRequest(null);
		if (resolve) resolve(result);
	}, []);

	// Ask for consent; resolves true if accepted (or already accepted), false if cancelled.
	const requestConsent = useCallback(({ policyType = 'Privacy', purpose } = {}) => {
		return new Promise((resolve) => {
			resolverRef.current = resolve;
			setRequest({ policyType, purpose });
		});
	}, []);

	return (
		<GdprConsentContext.Provider value={{ requestConsent }}>
			{children}
			{request && (
				<GdprConsentModal
					policyType={request.policyType}
					purpose={request.purpose}
					onConfirm={() => settle(true)}
					onClose={() => settle(false)}
				/>
			)}
		</GdprConsentContext.Provider>
	);
}

// Hook to request GDPR consent imperatively before a sensitive action (e.g. sharing).
export function useGdprConsent() {
	const ctx = useContext(GdprConsentContext);
	if (!ctx) throw new Error('useGdprConsent must be used within a GdprConsentProvider');
	return ctx;
}
