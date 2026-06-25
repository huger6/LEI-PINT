// Convenience hook for consuming the AuthContext.
import { useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';

// Returns all values from AuthContext and throws if used outside AuthProvider.
export function useAuth() {
	// Reads the AuthContext value and throws if used outside its provider.
	const ctx = useContext(AuthContext);

	if (!ctx) throw new Error('useAuth must be used inside AuthProvider');

	return ctx;
}
