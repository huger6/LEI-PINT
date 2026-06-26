// Convenience hook for consuming the UserContext.
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

// Returns all values from UserContext and throws if used outside UserProvider.
export function useUser() {
    // Reads the UserContext value and throws if used outside its provider.
    const ctx = useContext(UserContext);

    if (!ctx) throw new Error('useUser must be used inside UserProvider');

    return ctx;
}
